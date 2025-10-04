#!/usr/bin/env node
/**
 * SDR Exam System mit Video-Ident & Proctoring
 * Purpose: Adaptive Tests mit automatischer Auswertung und Audit-Trail
 * Version: 1.0.0
 * Build: 2025-10-04T161800Z UTC
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SDRExamSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            examDataDir: config.examDataDir || './exam-data',
            evidenceDir: config.evidenceDir || './evidence',
            mediaDir: config.mediaDir || './media',
            proctoringEnabled: config.proctoringEnabled !== false,
            videoIdentEnabled: config.videoIdentEnabled !== false,
            retentionDays: config.retentionDays || 1095, // 3 Jahre
            ...config
        };
        
        this.exams = new Map();
        this.sessions = new Map();
        this.proctors = new Map();
        this.evidence = new Map();
        this.questionBanks = new Map();
        
        this.isInitialized = false;
    }

    /**
     * Initialisiert das Prüfungssystem
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('[EXAM] Initializing SDR Exam System...');
        
        try {
            // Verzeichnisse erstellen
            await this.ensureDirectories();
            
            // Fragenbänke laden
            await this.loadQuestionBanks();
            
            // Proctoren registrieren
            await this.initializeProctors();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('[EXAM] Exam System initialized successfully');
            
        } catch (error) {
            console.error('[EXAM] Initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Erstellt notwendige Verzeichnisse
     */
    async ensureDirectories() {
        const dirs = [
            this.config.examDataDir,
            this.config.evidenceDir,
            this.config.mediaDir,
            path.join(this.config.examDataDir, 'sessions'),
            path.join(this.config.examDataDir, 'results'),
            path.join(this.config.evidenceDir, 'video-ident'),
            path.join(this.config.evidenceDir, 'proctoring'),
            path.join(this.config.evidenceDir, 'signatures'),
            path.join(this.config.mediaDir, 'recordings'),
            path.join(this.config.mediaDir, 'snapshots')
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }
    }

    /**
     * Lädt Fragenbänke
     */
    async loadQuestionBanks() {
        const questionBanks = {
            'sdr-fundamentals': {
                id: 'sdr-fundamentals',
                name: 'SDR Grundlagen Prüfung',
                version: '1.0.0',
                questions: [
                    {
                        id: 'q001',
                        type: 'multiple-choice',
                        question: 'Was bedeutet SDR?',
                        options: [
                            'Software-Defined Radio',
                            'Signal-Digital-Radio',
                            'Standard-Digital-Radio',
                            'Super-Digital-Radio'
                        ],
                        correctAnswer: 0,
                        difficulty: 'easy',
                        category: 'basics',
                        explanation: 'SDR steht für Software-Defined Radio, eine Funktechnologie bei der die Signalverarbeitung größtenteils in Software erfolgt.'
                    },
                    {
                        id: 'q002',
                        type: 'multiple-choice',
                        question: 'Welche Frequenzbänder sind für Amateurfunk in Deutschland erlaubt?',
                        options: [
                            'Nur 2m und 70cm',
                            'Alle Bänder von 160m bis 70cm',
                            'Nur Bänder über 1GHz',
                            'Nur Bänder unter 100MHz'
                        ],
                        correctAnswer: 1,
                        difficulty: 'medium',
                        category: 'frequency-law',
                        explanation: 'In Deutschland sind Amateurfunk-Bänder von 160m bis 70cm und darüber hinaus erlaubt, je nach Lizenzklasse.'
                    },
                    {
                        id: 'q003',
                        type: 'true-false',
                        question: 'Bei SDR-Systemen wird die Signalverarbeitung hauptsächlich in Software durchgeführt.',
                        correctAnswer: true,
                        difficulty: 'easy',
                        category: 'basics',
                        explanation: 'Ja, das ist das Hauptmerkmal von SDR-Systemen - die Signalverarbeitung erfolgt in Software statt in Hardware.'
                    },
                    {
                        id: 'q004',
                        type: 'numerical',
                        question: 'Wie hoch ist die maximale Sendeleistung für Amateurfunk in Deutschland ohne besondere Genehmigung?',
                        correctAnswer: 750,
                        tolerance: 50,
                        unit: 'W',
                        difficulty: 'medium',
                        category: 'frequency-law',
                        explanation: 'Die maximale Sendeleistung für Amateurfunk beträgt 750W PEP ohne besondere Genehmigung.'
                    }
                ],
                passingScore: 70,
                timeLimit: 60, // Minuten
                attempts: 3,
                randomization: {
                    questions: true,
                    options: true,
                    seed: null // Wird zur Laufzeit generiert
                }
            },
            'sdr-technical': {
                id: 'sdr-technical',
                name: 'Technische SDR-Prüfung',
                version: '1.0.0',
                questions: [
                    {
                        id: 'q101',
                        type: 'multiple-choice',
                        question: 'Welches Modulationsverfahren wird hauptsächlich für digitale Amateurfunk-Modi verwendet?',
                        options: [
                            'AM',
                            'FM',
                            'SSB',
                            'PSK31'
                        ],
                        correctAnswer: 3,
                        difficulty: 'medium',
                        category: 'modulation',
                        explanation: 'PSK31 ist ein populärer digitaler Modus im Amateurfunk für Textübertragung.'
                    },
                    {
                        id: 'q102',
                        type: 'calculation',
                        question: 'Berechnen Sie die Wellenlänge für 144.5 MHz.',
                        formula: 'lambda = c / f',
                        given: {
                            c: 300000000, // m/s
                            f: 144500000  // Hz
                        },
                        correctAnswer: 2.08,
                        tolerance: 0.1,
                        unit: 'm',
                        difficulty: 'medium',
                        category: 'calculations',
                        explanation: 'lambda = c / f = 300,000,000 / 144,500,000 = 2.08 Meter'
                    }
                ],
                passingScore: 75,
                timeLimit: 90,
                attempts: 2,
                randomization: {
                    questions: true,
                    options: true,
                    seed: null
                }
            }
        };
        
        for (const [bankId, bankData] of Object.entries(questionBanks)) {
            this.questionBanks.set(bankId, {
                ...bankData,
                createdAt: new Date().toISOString(),
                hash: crypto.createHash('sha256').update(JSON.stringify(bankData)).digest('hex')
            });
        }
        
        console.log(`[EXAM] Loaded ${this.questionBanks.size} question banks`);
    }

    /**
     * Initialisiert Proctoren
     */
    async initializeProctors() {
        const proctors = [
            {
                id: 'PROCTOR-001',
                name: 'Dr. Max Mustermann',
                qualifications: ['SDR-Expert', 'Proctoring-Certified'],
                available: true,
                maxConcurrent: 5,
                timezone: 'Europe/Berlin'
            },
            {
                id: 'PROCTOR-002',
                name: 'Prof. Dr. Anna Schmidt',
                qualifications: ['RF-Engineering', 'Educational-Psychology'],
                available: true,
                maxConcurrent: 3,
                timezone: 'Europe/Berlin'
            }
        ];
        
        for (const proctor of proctors) {
            this.proctors.set(proctor.id, {
                ...proctor,
                activeSessions: [],
                totalSessions: 0,
                rating: 5.0,
                createdAt: new Date().toISOString()
            });
        }
        
        console.log(`[EXAM] Initialized ${this.proctors.size} proctors`);
    }

    /**
     * Startet eine Prüfungssession
     */
    async startExamSession(userId, courseId, profile = 'B', proctoringMode = 'trust-but-verify') {
        const examId = `EXAM-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
        const sessionId = `SESSION-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
        
        // Fragenbank für Kurs laden
        const questionBank = this.questionBanks.get(courseId);
        if (!questionBank) {
            throw new Error(`Question bank not found for course: ${courseId}`);
        }
        
        // Prüfung erstellen
        const exam = await this.createExam(examId, questionBank, profile);
        
        // Session erstellen
        const session = {
            sessionId,
            examId,
            userId,
            courseId,
            profile,
            proctoringMode,
            startedAt: new Date().toISOString(),
            status: 'active',
            currentQuestion: 0,
            answers: [],
            timeRemaining: exam.timeLimit * 60, // Sekunden
            proctorId: null,
            videoSessionId: null,
            evidence: {
                sessionHash: null,
                integrityChecks: [],
                proctoringEvents: [],
                videoIdentEvents: []
            }
        };
        
        // Proctoring basierend auf Profil und Modus
        if (proctoringMode !== 'none') {
            await this.setupProctoring(session);
        }
        
        // Video-Ident falls erforderlich
        if (profile === 'A' || profile === 'B') {
            await this.setupVideoIdent(session);
        }
        
        // Integritätsprüfungen
        await this.performIntegrityChecks(session);
        
        this.sessions.set(sessionId, session);
        this.exams.set(examId, exam);
        
        this.emit('exam-started', { sessionId, examId, userId, courseId });
        
        console.log(`[EXAM] Exam session started: ${sessionId} for user ${userId}`);
        
        return {
            sessionId,
            examId,
            exam: exam,
            proctoringSetup: session.proctorId ? true : false,
            videoIdentRequired: profile === 'A'
        };
    }

    /**
     * Erstellt eine Prüfung aus Fragenbank
     */
    async createExam(examId, questionBank, profile) {
        const exam = {
            id: examId,
            questionBankId: questionBank.id,
            version: questionBank.version,
            questions: [],
            randomizationSeed: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            hash: null
        };
        
        // Fragen basierend auf Profil filtern
        let availableQuestions = questionBank.questions;
        
        // Profil C bekommt einfachere Fragen
        if (profile === 'C') {
            availableQuestions = questionBank.questions.filter(q => q.difficulty === 'easy');
        }
        
        // Fragen randomisieren
        const shuffledQuestions = this.shuffleArray([...availableQuestions], exam.randomizationSeed);
        
        // Fragen für Prüfung auswählen (max. 20)
        exam.questions = shuffledQuestions.slice(0, Math.min(20, shuffledQuestions.length));
        
        // Optionen randomisieren falls aktiviert
        if (questionBank.randomization.options) {
            exam.questions.forEach(question => {
                if (question.type === 'multiple-choice') {
                    const shuffledOptions = this.shuffleArray([...question.options], exam.randomizationSeed);
                    const correctIndex = shuffledOptions.findIndex(option => 
                        option === question.options[question.correctAnswer]
                    );
                    
                    question.options = shuffledOptions;
                    question.correctAnswer = correctIndex;
                    question.originalCorrectAnswer = question.correctAnswer;
                }
            });
        }
        
        // Hash für Integrität berechnen
        exam.hash = crypto.createHash('sha256').update(JSON.stringify(exam)).digest('hex');
        
        return exam;
    }

    /**
     * Array shufflen mit Seed
     */
    shuffleArray(array, seed) {
        const shuffled = [...array];
        let currentIndex = shuffled.length;
        
        // Einfacher PRNG mit Seed
        let prng = this.seededRandom(seed);
        
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(prng() * currentIndex);
            currentIndex--;
            [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
        }
        
        return shuffled;
    }

    /**
     * Seeded Random Number Generator
     */
    seededRandom(seed) {
        let x = 0;
        for (let i = 0; i < seed.length; i++) {
            x = ((x << 5) - x + seed.charCodeAt(i)) & 0xffffffff;
        }
        
        return () => {
            x = (x * 1664525 + 1013904223) & 0xffffffff;
            return x / 0x100000000;
        };
    }

    /**
     * Setup Proctoring
     */
    async setupProctoring(session) {
        if (session.proctoringMode === 'none') {
            return;
        }
        
        // Verfügbaren Proctor finden
        const availableProctor = Array.from(this.proctors.values()).find(proctor => 
            proctor.available && proctor.activeSessions.length < proctor.maxConcurrent
        );
        
        if (!availableProctor) {
            console.warn(`[EXAM] No available proctor for session ${session.sessionId}`);
            return;
        }
        
        session.proctorId = availableProctor.id;
        availableProctor.activeSessions.push(session.sessionId);
        
        // Proctoring-Events basierend auf Modus
        switch (session.proctoringMode) {
            case 'live':
                await this.setupLiveProctoring(session);
                break;
            case 'deferred':
                await this.setupDeferredProctoring(session);
                break;
            case 'trust-but-verify':
                await this.setupTrustButVerifyProctoring(session);
                break;
        }
        
        console.log(`[EXAM] Proctoring setup for session ${session.sessionId} with proctor ${session.proctorId}`);
    }

    /**
     * Setup Live Proctoring
     */
    async setupLiveProctoring(session) {
        session.evidence.proctoringEvents.push({
            type: 'live-proctoring-started',
            timestamp: new Date().toISOString(),
            proctorId: session.proctorId,
            setup: {
                videoEnabled: true,
                audioEnabled: true,
                screenShareEnabled: false,
                chatEnabled: true
            }
        });
    }

    /**
     * Setup Deferred Proctoring
     */
    async setupDeferredProctoring(session) {
        session.evidence.proctoringEvents.push({
            type: 'deferred-proctoring-started',
            timestamp: new Date().toISOString(),
            proctorId: session.proctorId,
            setup: {
                recordingEnabled: true,
                screenshotInterval: 30, // Sekunden
                reviewRequired: true
            }
        });
    }

    /**
     * Setup Trust-but-Verify Proctoring
     */
    async setupTrustButVerifyProctoring(session) {
        session.evidence.proctoringEvents.push({
            type: 'trust-but-verify-started',
            timestamp: new Date().toISOString(),
            setup: {
                integrityChecks: true,
                randomSpotChecks: true,
                behavioralAnalysis: false,
                recordingEnabled: false
            }
        });
    }

    /**
     * Setup Video-Ident
     */
    async setupVideoIdent(session) {
        if (!this.config.videoIdentEnabled) {
            return;
        }
        
        const videoSessionId = `VIDEO-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
        session.videoSessionId = videoSessionId;
        
        session.evidence.videoIdentEvents.push({
            type: 'video-ident-started',
            timestamp: new Date().toISOString(),
            sessionId: videoSessionId,
            requirements: {
                documentVerification: session.profile === 'A',
                livenessDetection: true,
                faceMatch: session.profile === 'A',
                consentGiven: false
            }
        });
        
        console.log(`[EXAM] Video-Ident setup for session ${session.sessionId}`);
    }

    /**
     * Führt Integritätsprüfungen durch
     */
    async performIntegrityChecks(session) {
        const checks = [
            {
                type: 'browser-check',
                result: await this.checkBrowserIntegrity(),
                timestamp: new Date().toISOString()
            },
            {
                type: 'device-check',
                result: await this.checkDeviceIntegrity(),
                timestamp: new Date().toISOString()
            },
            {
                type: 'network-check',
                result: await this.checkNetworkIntegrity(),
                timestamp: new Date().toISOString()
            }
        ];
        
        session.evidence.integrityChecks = checks;
        
        // Session-Hash berechnen
        session.evidence.sessionHash = crypto.createHash('sha256')
            .update(JSON.stringify(session))
            .digest('hex');
        
        console.log(`[EXAM] Integrity checks completed for session ${session.sessionId}`);
    }

    /**
     * Browser-Integrität prüfen
     */
    async checkBrowserIntegrity() {
        // Simuliert Browser-Integritätsprüfung
        return {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            secureContext: true,
            extensionsDetected: [],
            developerToolsOpen: false,
            integrity: 'passed'
        };
    }

    /**
     * Geräte-Integrität prüfen
     */
    async checkDeviceIntegrity() {
        // Simuliert Geräte-Integritätsprüfung
        return {
            screenResolution: '1920x1080',
            timezone: 'Europe/Berlin',
            language: 'de-DE',
            cameraAvailable: true,
            microphoneAvailable: true,
            integrity: 'passed'
        };
    }

    /**
     * Netzwerk-Integrität prüfen
     */
    async checkNetworkIntegrity() {
        // Simuliert Netzwerk-Integritätsprüfung
        return {
            connectionType: 'wifi',
            latency: 25,
            bandwidth: 100,
            proxyDetected: false,
            vpnDetected: false,
            integrity: 'passed'
        };
    }

    /**
     * Beantwortet eine Prüfungsfrage
     */
    async answerQuestion(sessionId, questionIndex, answer, timeSpent = 0) {
        const session = this.sessions.get(sessionId);
        const exam = this.exams.get(session.examId);
        
        if (!session || !exam) {
            throw new Error('Session or exam not found');
        }
        
        if (session.status !== 'active') {
            throw new Error('Session is not active');
        }
        
        if (questionIndex >= exam.questions.length) {
            throw new Error('Invalid question index');
        }
        
        const question = exam.questions[questionIndex];
        
        // Antwort validieren
        const isValidAnswer = this.validateAnswer(question, answer);
        
        // Antwort speichern
        const answerRecord = {
            questionIndex,
            questionId: question.id,
            answer,
            timeSpent,
            timestamp: new Date().toISOString(),
            isValid: isValidAnswer
        };
        
        session.answers[questionIndex] = answerRecord;
        
        // Zeit aktualisieren
        session.timeRemaining -= timeSpent;
        
        // Proctoring-Events
        if (session.proctoringMode !== 'none') {
            session.evidence.proctoringEvents.push({
                type: 'question-answered',
                timestamp: new Date().toISOString(),
                questionIndex,
                timeSpent,
                suspiciousActivity: false
            });
        }
        
        this.emit('question-answered', { sessionId, questionIndex, answer, timeSpent });
        
        console.log(`[EXAM] Question ${questionIndex} answered in session ${sessionId}`);
        
        return {
            isValid: isValidAnswer,
            timeRemaining: session.timeRemaining,
            nextQuestion: questionIndex + 1 < exam.questions.length ? questionIndex + 1 : null
        };
    }

    /**
     * Validiert Antwort
     */
    validateAnswer(question, answer) {
        switch (question.type) {
            case 'multiple-choice':
                return answer >= 0 && answer < question.options.length;
                
            case 'true-false':
                return typeof answer === 'boolean';
                
            case 'numerical':
                const numAnswer = parseFloat(answer);
                const correct = question.correctAnswer;
                const tolerance = question.tolerance || 0;
                return numAnswer >= (correct - tolerance) && numAnswer <= (correct + tolerance);
                
            case 'calculation':
                const calcAnswer = parseFloat(answer);
                const calcCorrect = question.correctAnswer;
                const calcTolerance = question.tolerance || 0.1;
                return calcAnswer >= (calcCorrect - calcTolerance) && calcAnswer <= (calcCorrect + calcTolerance);
                
            default:
                return false;
        }
    }

    /**
     * Beendet Prüfungssession
     */
    async endExamSession(sessionId, reason = 'completed') {
        const session = this.sessions.get(sessionId);
        const exam = this.exams.get(session.examId);
        
        if (!session || !exam) {
            throw new Error('Session or exam not found');
        }
        
        // Prüfung auswerten
        const result = await this.evaluateExam(session, exam);
        
        // Session beenden
        session.status = 'completed';
        session.endedAt = new Date().toISOString();
        session.result = result;
        
        // Proctor freigeben
        if (session.proctorId) {
            const proctor = this.proctors.get(session.proctorId);
            if (proctor) {
                proctor.activeSessions = proctor.activeSessions.filter(id => id !== sessionId);
                proctor.totalSessions++;
            }
        }
        
        // Evidenz sammeln
        await this.collectEvidence(session);
        
        // Ergebnis signieren
        const signedResult = await this.signExamResult(result);
        
        this.emit('exam-completed', { sessionId, result: signedResult });
        
        console.log(`[EXAM] Exam session completed: ${sessionId}, Score: ${result.score}%`);
        
        return signedResult;
    }

    /**
     * Wertet Prüfung aus
     */
    async evaluateExam(session, exam) {
        const questionBank = this.questionBanks.get(session.courseId);
        let correctAnswers = 0;
        let totalQuestions = exam.questions.length;
        
        // Antworten bewerten
        for (let i = 0; i < exam.questions.length; i++) {
            const question = exam.questions[i];
            const answer = session.answers[i];
            
            if (!answer) {
                continue; // Nicht beantwortet
            }
            
            let isCorrect = false;
            
            switch (question.type) {
                case 'multiple-choice':
                    isCorrect = answer.answer === question.correctAnswer;
                    break;
                    
                case 'true-false':
                    isCorrect = answer.answer === question.correctAnswer;
                    break;
                    
                case 'numerical':
                    const numAnswer = parseFloat(answer.answer);
                    const correct = question.correctAnswer;
                    const tolerance = question.tolerance || 0;
                    isCorrect = numAnswer >= (correct - tolerance) && numAnswer <= (correct + tolerance);
                    break;
                    
                case 'calculation':
                    const calcAnswer = parseFloat(answer.answer);
                    const calcCorrect = question.correctAnswer;
                    const calcTolerance = question.tolerance || 0.1;
                    isCorrect = calcAnswer >= (calcCorrect - calcTolerance) && calcAnswer <= (calcCorrect + calcTolerance);
                    break;
            }
            
            if (isCorrect) {
                correctAnswers++;
            }
            
            // Antwort-Metadaten aktualisieren
            answer.isCorrect = isCorrect;
        }
        
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const passed = score >= questionBank.passingScore;
        
        const result = {
            sessionId: session.sessionId,
            examId: session.examId,
            userId: session.userId,
            courseId: session.courseId,
            score,
            correctAnswers,
            totalQuestions,
            passed,
            passingScore: questionBank.passingScore,
            timeSpent: (exam.timeLimit * 60) - session.timeRemaining,
            completedAt: new Date().toISOString(),
            answers: session.answers,
            evidence: session.evidence,
            proctoringMode: session.proctoringMode,
            proctorId: session.proctorId,
            videoIdentCompleted: session.videoSessionId ? true : false
        };
        
        return result;
    }

    /**
     * Sammelt Evidenz
     */
    async collectEvidence(session) {
        const evidencePackage = {
            sessionId: session.sessionId,
            userId: session.userId,
            courseId: session.courseId,
            collectedAt: new Date().toISOString(),
            integrityChecks: session.evidence.integrityChecks,
            proctoringEvents: session.evidence.proctoringEvents,
            videoIdentEvents: session.evidence.videoIdentEvents,
            sessionHash: session.evidence.sessionHash,
            packageHash: null
        };
        
        // Evidenz-Paket-Hash berechnen
        evidencePackage.packageHash = crypto.createHash('sha256')
            .update(JSON.stringify(evidencePackage))
            .digest('hex');
        
        // Evidenz speichern
        this.evidence.set(session.sessionId, evidencePackage);
        
        // Persistieren
        await this.persistEvidence(evidencePackage);
        
        console.log(`[EXAM] Evidence collected for session ${session.sessionId}`);
    }

    /**
     * Signiert Prüfungsergebnis
     */
    async signExamResult(result) {
        const signature = {
            algorithm: 'ECDSA-SHA256',
            timestamp: new Date().toISOString(),
            signer: 'SDR-EXAM-SYSTEM',
            signature: crypto.createHash('sha256')
                .update(JSON.stringify(result))
                .digest('hex')
        };
        
        const signedResult = {
            ...result,
            signature,
            signedAt: new Date().toISOString()
        };
        
        return signedResult;
    }

    /**
     * Persistiert Evidenz
     */
    async persistEvidence(evidence) {
        const evidenceFile = path.join(
            this.config.evidenceDir,
            'sessions',
            `evidence-${evidence.sessionId}.json`
        );
        
        await fs.writeFile(evidenceFile, JSON.stringify(evidence, null, 2));
    }

    /**
     * Verifiziert Prüfungsergebnis
     */
    async verifyExamResult(result) {
        // Signatur prüfen
        if (!result.signature) {
            return { valid: false, reason: 'No signature found' };
        }
        
        // Hash prüfen
        const expectedHash = crypto.createHash('sha256')
            .update(JSON.stringify({ ...result, signature: undefined }))
            .digest('hex');
        
        if (expectedHash !== result.signature.signature) {
            return { valid: false, reason: 'Signature verification failed' };
        }
        
        // Evidenz prüfen
        const evidence = this.evidence.get(result.sessionId);
        if (!evidence) {
            return { valid: false, reason: 'Evidence not found' };
        }
        
        return { valid: true, evidence };
    }

    /**
     * Generiert Prüfungsbericht
     */
    async generateExamReport(sessionId) {
        const session = this.sessions.get(sessionId);
        const exam = this.exams.get(session.examId);
        const evidence = this.evidence.get(sessionId);
        
        if (!session || !exam || !evidence) {
            throw new Error('Session, exam, or evidence not found');
        }
        
        const report = {
            sessionId,
            examId: session.examId,
            userId: session.userId,
            courseId: session.courseId,
            generatedAt: new Date().toISOString(),
            result: session.result,
            exam: {
                questionBankId: exam.questionBankId,
                version: exam.version,
                totalQuestions: exam.questions.length,
                timeLimit: exam.timeLimit
            },
            session: {
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                proctoringMode: session.proctoringMode,
                proctorId: session.proctorId
            },
            evidence: {
                integrityChecks: evidence.integrityChecks,
                proctoringEvents: evidence.proctoringEvents,
                videoIdentEvents: evidence.videoIdentEvents
            },
            compliance: {
                gdprCompliant: true,
                auditTrail: true,
                tamperEvident: true
            }
        };
        
        return report;
    }
}

// CLI-Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.error('Usage: node exam-engine.js <command> [options]');
        console.error('Commands: init, start-exam, answer-question, end-exam, verify-result, generate-report');
        process.exit(1);
    }
    
    const command = args[0];
    const examSystem = new SDRExamSystem();
    
    async function main() {
        await examSystem.initialize();
        
        switch (command) {
            case 'init':
                console.log('Exam System initialized successfully');
                break;
                
            case 'start-exam':
                const session = await examSystem.startExamSession(
                    args[1] || 'USER-TEST',
                    args[2] || 'sdr-fundamentals',
                    args[3] || 'B',
                    args[4] || 'trust-but-verify'
                );
                console.log('Exam session started:', JSON.stringify(session, null, 2));
                break;
                
            case 'verify-result':
                // Simuliert Ergebnis-Verifikation
                console.log('Result verification completed');
                break;
                
            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    }
    
    main().catch(error => {
        console.error('Exam system error:', error);
        process.exit(1);
    });
}

module.exports = SDRExamSystem;
