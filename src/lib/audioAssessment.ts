/**
 * Audio Assessment Engine (V2-4)
 * ────────────────────────────────
 * Web Audio API 기반 마이크 입력 버퍼링 + 발음 평가 뼈대 코드.
 * 향후 MFCC/DTW WebAssembly 모듈과 연동하여 실제 점수를 산출합니다.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ───

export interface AssessmentResult {
    /** 1 ~ 100 발음 매칭률 점수 */
    score: number;
    /** 음소별 정확도 (0~1) */
    phonemeScores: { phoneme: string; accuracy: number }[];
    /** 녹음된 오디오 버퍼 (waveform 시각화용) */
    waveformData: Float32Array;
    /** 전체 녹음 길이 (초) */
    durationSec: number;
}

export interface AssessmentOptions {
    /** 목표 단어 */
    targetWord: string;
    /** 목표 음소 배열 (e.g. ["k", "æ", "t"]) */
    targetPhonemes: string[];
    /** 녹음 제한 시간 (ms, 기본 5000) */
    maxDurationMs?: number;
    /** 실시간 waveform 콜백 (0~1 정규화된 볼륨) */
    onWaveformUpdate?: (data: Float32Array) => void;
    /** 볼륨 레벨 콜백 (0~1) */
    onVolumeChange?: (volume: number) => void;
}

// ─── Mic Stream Manager ───

let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
let scriptProcessorNode: ScriptProcessorNode | null = null;

/** 녹음 중 버퍼를 모으는 배열 */
let recordingChunks: Float32Array[] = [];
let isRecording = false;

/**
 * 마이크 접근 권한 요청 및 AudioContext 초기화
 */
export async function initMicStream(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 16000,
            },
        });

        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000,
        });

        sourceNode = audioContext.createMediaStreamSource(mediaStream);

        // AnalyserNode — 실시간 주파수/파형 분석용
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 2048;
        analyserNode.smoothingTimeConstant = 0.8;
        sourceNode.connect(analyserNode);

        return true;
    } catch (err) {
        console.warn('🎤 Mic access denied or unavailable:', err);
        return false;
    }
}

/**
 * 마이크 스트림 정리
 */
export function disposeMicStream(): void {
    isRecording = false;

    if (scriptProcessorNode) {
        scriptProcessorNode.disconnect();
        scriptProcessorNode = null;
    }
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (analyserNode) {
        analyserNode.disconnect();
        analyserNode = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
        audioContext = null;
    }

    recordingChunks = [];
}

/**
 * 녹음 시작 — 마이크 입력을 Float32Array 청크로 버퍼링
 */
export function startRecording(options?: Pick<AssessmentOptions, 'onWaveformUpdate' | 'onVolumeChange'>): void {
    if (!audioContext || !analyserNode || !sourceNode) {
        console.warn('⚠️ Mic not initialized. Call initMicStream() first.');
        return;
    }

    recordingChunks = [];
    isRecording = true;

    // ScriptProcessorNode로 raw PCM 수집 (deprecated이지만 AudioWorklet보다 호환성 높음)
    const bufferSize = 4096;
    scriptProcessorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

    scriptProcessorNode.onaudioprocess = (event) => {
        if (!isRecording) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const chunk = new Float32Array(inputData.length);
        chunk.set(inputData);
        recordingChunks.push(chunk);

        // 실시간 waveform 콜백
        if (options?.onWaveformUpdate) {
            const waveform = new Float32Array(analyserNode!.frequencyBinCount);
            analyserNode!.getFloatTimeDomainData(waveform);
            options.onWaveformUpdate(waveform);
        }

        // 볼륨 레벨 콜백
        if (options?.onVolumeChange) {
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            const normalizedVolume = Math.min(1, rms * 5); // 0~1 범위로 정규화
            options.onVolumeChange(normalizedVolume);
        }
    };

    sourceNode.connect(scriptProcessorNode);
    scriptProcessorNode.connect(audioContext.destination);
}

/**
 * 녹음 중지 — 버퍼링된 청크를 하나의 Float32Array로 합침
 */
export function stopRecording(): Float32Array {
    isRecording = false;

    if (scriptProcessorNode) {
        scriptProcessorNode.disconnect();
        scriptProcessorNode = null;
    }

    // 모든 청크를 하나의 배열로 합치기
    const totalLength = recordingChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const fullBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of recordingChunks) {
        fullBuffer.set(chunk, offset);
        offset += chunk.length;
    }

    recordingChunks = [];
    return fullBuffer;
}

// ─── Waveform 분석 유틸리티 ───

/**
 * 현재 AnalyserNode에서 실시간 waveform 데이터 읽기
 */
export function getRealtimeWaveform(): Float32Array | null {
    if (!analyserNode) return null;
    const data = new Float32Array(analyserNode.frequencyBinCount);
    analyserNode.getFloatTimeDomainData(data);
    return data;
}

/**
 * 현재 AnalyserNode에서 주파수 스펙트럼 데이터 읽기
 */
export function getFrequencyData(): Uint8Array | null {
    if (!analyserNode) return null;
    const data = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(data);
    return data;
}

/**
 * 녹음된 버퍼를 시각화용으로 다운샘플링
 * @param buffer 원본 Float32Array
 * @param targetLength 출력 샘플 수 (기본 128)
 */
export function downsampleWaveform(buffer: Float32Array, targetLength = 128): Float32Array {
    const blockSize = Math.floor(buffer.length / targetLength);
    const result = new Float32Array(targetLength);

    for (let i = 0; i < targetLength; i++) {
        let sum = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(buffer[start + j] || 0);
        }
        result[i] = sum / blockSize;
    }

    return result;
}

// ─── WebAssembly 래퍼 (Stub) ───

/**
 * [STUB] MFCC(Mel-Frequency Cepstral Coefficients) 특성 추출
 * 향후 Wasm 모듈로 대체 예정
 *
 * @param audioBuffer 16kHz mono PCM Float32Array
 * @returns MFCC 계수 배열 (프레임 × 13차 계수)
 */
export async function extractMFCC(audioBuffer: Float32Array): Promise<Float32Array[]> {
    // TODO: WebAssembly MFCC 모듈 로드 및 연산
    // 현재는 더미 데이터 반환
    const frameCount = Math.floor(audioBuffer.length / 512);
    const mfccFrames: Float32Array[] = [];

    for (let i = 0; i < frameCount; i++) {
        const frame = new Float32Array(13);
        // 더미: 에너지 기반 간이 계산
        const start = i * 512;
        let energy = 0;
        for (let j = 0; j < 512; j++) {
            energy += (audioBuffer[start + j] || 0) ** 2;
        }
        frame[0] = Math.log(energy + 1e-8);
        mfccFrames.push(frame);
    }

    return mfccFrames;
}

/**
 * [STUB] DTW(Dynamic Time Warping) 기반 발음 유사도 계산
 * 향후 Wasm 모듈로 대체 예정
 *
 * @param userMFCC 사용자 발화 MFCC
 * @param refMFCC 참조(정답) 발화 MFCC
 * @returns 0 ~ 1 유사도 점수 (1 = 완벽 일치)
 */
export async function computeDTWSimilarity(
    userMFCC: Float32Array[],
    refMFCC: Float32Array[]
): Promise<number> {
    // TODO: WebAssembly DTW 모듈 연산
    // 현재는 프레임 수 기반 간이 유사도 반환
    if (userMFCC.length === 0 || refMFCC.length === 0) return 0;

    const lengthRatio = Math.min(userMFCC.length, refMFCC.length) /
        Math.max(userMFCC.length, refMFCC.length);

    // 에너지 패턴 간이 비교
    const userEnergy = userMFCC.map((f) => f[0]);
    const refEnergy = refMFCC.map((f) => f[0]);

    let correlation = 0;
    const minLen = Math.min(userEnergy.length, refEnergy.length);
    for (let i = 0; i < minLen; i++) {
        correlation += 1 - Math.abs(userEnergy[i] - refEnergy[i]) / (Math.abs(refEnergy[i]) + 1e-8);
    }
    correlation /= minLen;

    return Math.max(0, Math.min(1, lengthRatio * 0.3 + correlation * 0.7));
}

// ─── 통합 발음 평가 함수 ───

/**
 * 녹음된 오디오로 발음 평가 수행
 * 현재는 STT 결과 기반 간이 점수 + Wasm stub 결합.
 * 향후 Wasm MFCC/DTW 연동 시 정밀 평가로 업그레이드.
 *
 * @param recordedBuffer stopRecording()에서 반환된 PCM 버퍼
 * @param options 평가 옵션 (목표 단어, 음소 등)
 */
export async function assessPronunciation(
    recordedBuffer: Float32Array,
    options: AssessmentOptions
): Promise<AssessmentResult> {
    const { targetPhonemes } = options;
    const sampleRate = audioContext?.sampleRate || 16000;
    const durationSec = recordedBuffer.length / sampleRate;

    // 1. MFCC 특성 추출 (stub)
    const userMFCC = await extractMFCC(recordedBuffer);

    // 2. 참조 MFCC는 향후 사전 녹음된 모범 발음에서 추출
    //    현재는 더미 참조 생성
    const dummyRef = new Float32Array(recordedBuffer.length);
    for (let i = 0; i < dummyRef.length; i++) {
        dummyRef[i] = Math.sin(i * 0.01) * 0.5;
    }
    const refMFCC = await extractMFCC(dummyRef);

    // 3. DTW 유사도 계산 (stub)
    const similarity = await computeDTWSimilarity(userMFCC, refMFCC);

    // 4. 음소별 점수 생성 (stub — 향후 phoneme alignment으로 대체)
    const phonemeScores = targetPhonemes.map((phoneme) => ({
        phoneme,
        accuracy: Math.max(0.3, similarity + (Math.random() * 0.2 - 0.1)),
    }));

    // 5. 최종 점수 산출 (1~100)
    const rawScore = similarity * 100;
    const score = Math.round(Math.max(1, Math.min(100, rawScore)));

    // 6. 시각화용 다운샘플 waveform
    const waveformData = downsampleWaveform(recordedBuffer, 128);

    return {
        score,
        phonemeScores,
        waveformData,
        durationSec,
    };
}

// ─── 유틸리티 ───

/**
 * 마이크 권한 상태 확인
 */
export async function checkMicPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (typeof navigator === 'undefined' || !navigator.permissions) return 'prompt';

    try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return result.state as 'granted' | 'denied' | 'prompt';
    } catch {
        return 'prompt';
    }
}

/**
 * 녹음 중인지 여부
 */
export function getIsRecording(): boolean {
    return isRecording;
}
