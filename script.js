// Using global quizData from questions.js

// ---- DOM Elements ----
const screenStart = document.getElementById('screen-start');
const screenSplash = document.getElementById('screen-splash');
const screenQuiz = document.getElementById('screen-quiz');
const screenResult = document.getElementById('screen-result');

const playerPhotoInput = document.getElementById('player-photo');
const avatarPreviewLabel = document.getElementById('avatar-preview-label');
const playerNameInput = document.getElementById('player-name');

const resultAvatarImg = document.getElementById('result-avatar');
const resultAvatarFallback = document.getElementById('result-avatar-fallback');
const resultPlayerName = document.getElementById('result-player-name');

const btnStart = document.getElementById('btn-start');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnSkip = document.getElementById('btn-skip');
const btnRestart = document.getElementById('btn-restart');

const splashTitle = document.getElementById('splash-title');

const quizSubjectTitle = document.getElementById('quiz-subject-title');
const scoreDisplay = document.getElementById('score-display');
const progressBar = document.getElementById('progress-bar');
const currentQNumDisplay = document.getElementById('current-q-num');
const totalQNumDisplay = document.getElementById('total-q-num');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const explanationContainer = document.getElementById('explanation-container');
const explanationText = document.getElementById('explanation-text');

const finalScoreDisplay = document.getElementById('final-score');
const resultMessage = document.getElementById('result-message');

const audioCorrect = document.getElementById('audio-correct');
const audioWrong = document.getElementById('audio-wrong');

// ---- Game State ----
let playerName = "";
let playerPhotoUrl = "";
let currentSubjectIndex = 0;
let currentQuestionIndex = 0;
let globalQuestionCount = 0; // 0 to 49
const totalQuestions = 50;
let score = 0;

// Track history of user answers. 
// Format: { subjectIdx, questionIdx, selectedOptionIdx }
const userAnswers = [];

totalQNumDisplay.textContent = totalQuestions;

// ---- Core Functions ----

function showScreen(screenEl) {
    [screenStart, screenSplash, screenQuiz, screenResult].forEach(s => {
        if (s) s.classList.remove('active');
    });
    if (screenEl) screenEl.classList.add('active');
}

function startGame() {
    playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert("يرجى إدخال اسمك الكريم للبدء.");
        return;
    }

    currentSubjectIndex = 0;
    currentQuestionIndex = 0;
    globalQuestionCount = 0;
    score = 0;
    userAnswers.length = 0;
    scoreDisplay.textContent = score;
    
    // Reset any previous state for subsequent plays
    if (typeof confetti === 'function') confetti.reset();

    showSubjectSplash();
}

function showSubjectSplash() {
    const subject = quizData[currentSubjectIndex];
    splashTitle.textContent = subject.title;
    
    showScreen(screenSplash);
    
    // Wait a bit then show the first question of that subject
    setTimeout(() => {
        loadQuestion();
        showScreen(screenQuiz);
    }, 2000); // 2 second splash
}

function loadQuestion() {
    const subject = quizData[currentSubjectIndex];
    const question = subject.questions[currentQuestionIndex];
    
    quizSubjectTitle.textContent = subject.title;
    currentQNumDisplay.textContent = globalQuestionCount + 1;
    
    // Progress bar calculations
    const progressPercent = ((globalQuestionCount) / totalQuestions) * 100;
    progressBar.style.width = `${progressPercent}%`;

    questionText.textContent = question.text;
    
    // Clear and build options
    optionsContainer.innerHTML = '';
    explanationContainer.classList.add('hidden');
    btnNext.classList.add('hidden');
    btnSkip.classList.remove('hidden');
    
    // Check if we hit 'Previous' and already answered this
    const previousAnswer = userAnswers[globalQuestionCount];
    
    question.options.forEach((optText, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-item';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = optText;
        btn.appendChild(textSpan);
        
        // Icon span (initially hidden or empty)
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-rounded';
        btn.appendChild(iconSpan);

        if (previousAnswer !== undefined) {
             btn.classList.add('locked');
             btn.disabled = true;
             
             // If this button was the correct answer, highlight it green
             if (index === question.correctIndex) {
                 btn.classList.add('correct');
                 iconSpan.textContent = 'check_circle';
             }
             // If user selected this button and it was wrong, highlight it red
             else if (index === previousAnswer.selectedOptionIdx && index !== question.correctIndex) {
                 btn.classList.add('wrong');
                 iconSpan.textContent = 'cancel';
             }
        } else {
             btn.addEventListener('click', () => handleOptionClick(index, btn, question));
        }

        optionsContainer.appendChild(btn);
    });

    // If already answered, show the explanation block and the Next button
    if (previousAnswer !== undefined) {
        showExplanation(question.explanation);
        btnNext.classList.remove('hidden');
        btnSkip.classList.add('hidden');
    }
    
    // Handle Previous Button visibility
    if (globalQuestionCount === 0) {
        btnPrev.disabled = true;
    } else {
        btnPrev.disabled = false;
    }
}

function handleOptionClick(selectedIndex, clickedBtn, question) {
    // Lock all options
    const allOptions = optionsContainer.querySelectorAll('.option-item');
    allOptions.forEach(opt => {
        opt.classList.add('locked');
        // clone node to remove event listeners safely
        const newOpt = opt.cloneNode(true);
        opt.parentNode.replaceChild(newOpt, opt);
    });

    // Re-fetch since nodes were replaced
    const freshOptions = optionsContainer.querySelectorAll('.option-item');
    const freshClicked = freshOptions[selectedIndex];
    
    const isCorrect = (selectedIndex === question.correctIndex);

    // Save history
    userAnswers[globalQuestionCount] = {
        subjectIdx: currentSubjectIndex,
        questionIdx: currentQuestionIndex,
        selectedOptionIdx: selectedIndex
    };

    if (isCorrect) {
        // Correct Action
        score++;
        scoreDisplay.textContent = score;
        
        freshClicked.classList.add('correct');
        freshClicked.querySelector('.material-symbols-rounded').textContent = 'check_circle';
        
        playSound(audioCorrect);
    } else {
        // Wrong Action
        freshClicked.classList.add('wrong');
        freshClicked.querySelector('.material-symbols-rounded').textContent = 'cancel';
        
        // Highlight the correct one
        const correctBtn = freshOptions[question.correctIndex];
        correctBtn.classList.add('correct');
        correctBtn.querySelector('.material-symbols-rounded').textContent = 'check_circle';
        
        playSound(audioWrong);
    }
    
    showExplanation(question.explanation);
    btnNext.classList.remove('hidden');
    btnSkip.classList.add('hidden');
    
    // Update progress bar
    const progressPercent = ((globalQuestionCount + 1) / totalQuestions) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

function skipQuestion() {
    const subject = quizData[currentSubjectIndex];
    const question = subject.questions[currentQuestionIndex];

    // Lock all options
    const allOptions = optionsContainer.querySelectorAll('.option-item');
    allOptions.forEach(opt => {
        opt.classList.add('locked');
        const newOpt = opt.cloneNode(true);
        opt.parentNode.replaceChild(newOpt, opt);
    });

    const freshOptions = optionsContainer.querySelectorAll('.option-item');

    // Save history with invalid selection index -1
    userAnswers[globalQuestionCount] = {
        subjectIdx: currentSubjectIndex,
        questionIdx: currentQuestionIndex,
        selectedOptionIdx: -1
    };

    // Highlight the correct one
    const correctBtn = freshOptions[question.correctIndex];
    if (correctBtn) {
        correctBtn.classList.add('correct');
        const iconSpan = correctBtn.querySelector('.material-symbols-rounded');
        if (iconSpan) iconSpan.textContent = 'check_circle';
    }
    
    // Play wrong sound
    playSound(audioWrong);

    showExplanation(question.explanation);
    btnNext.classList.remove('hidden');
    btnSkip.classList.add('hidden');
    
    // Update progress bar
    const progressPercent = ((globalQuestionCount + 1) / totalQuestions) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

function showExplanation(text) {
    explanationText.textContent = text;
    explanationContainer.classList.remove('hidden');
}

function playSound(audioEl) {
    if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.log('Audio blocked by browser policy until interaction', e));
    }
}

function goNext() {
    globalQuestionCount++;
    currentQuestionIndex++;
    
    // Check if we finished the current subject
    if (currentQuestionIndex >= quizData[currentSubjectIndex].questions.length) {
        currentSubjectIndex++;
        currentQuestionIndex = 0;
        
        // Check if game is completely over
        if (currentSubjectIndex >= quizData.length || globalQuestionCount >= totalQuestions) {
            endGame();
            return;
        } else {
            // Check if we have already gone through this splash via the back button (if globalQuestionCount points to an answered question)
            if (userAnswers[globalQuestionCount] !== undefined) {
               // Silently load next subject without splash if we're just navigating history
               loadQuestion();
            } else {
               showSubjectSplash();
            }
            return;
        }
    }
    
    loadQuestion();
}

function goPrev() {
    if (globalQuestionCount > 0) {
        globalQuestionCount--;
        
        // Re-calculate subject and question indices based on history
        const hist = userAnswers[globalQuestionCount];
        if (hist) {
            currentSubjectIndex = hist.subjectIdx;
            currentQuestionIndex = hist.questionIdx;
        } else {
            // Fallback logic if history somehow missing (shouldn't happen)
            if (currentQuestionIndex === 0 && currentSubjectIndex > 0) {
                currentSubjectIndex--;
                currentQuestionIndex = quizData[currentSubjectIndex].questions.length - 1;
            } else {
                currentQuestionIndex--;
            }
        }
        
        loadQuestion();
    }
}

function endGame() {
    finalScoreDisplay.textContent = score;
    resultPlayerName.textContent = playerName;

    // Display loaded photo or fallback
    if (playerPhotoUrl) {
        resultAvatarImg.src = playerPhotoUrl;
        resultAvatarImg.classList.remove('hidden');
        resultAvatarFallback.classList.add('hidden');
    } else {
        resultAvatarImg.classList.add('hidden');
        resultAvatarFallback.classList.remove('hidden');
    }
    
    if (score >= 45) {
        resultMessage.textContent = 'ممتاز جداً! لديك معرفة قوية جداً بأحكام النكاح.';
    } else if (score >= 35) {
        resultMessage.textContent = 'جيد جداً! معلوماتك قيمة.';
    } else if (score >= 25) {
        resultMessage.textContent = 'جيد، ولكن يمكنك مراجعة بعض الأحكام لمزيد من الفقه.';
    } else {
        resultMessage.textContent = 'تحتاج إلى مراجعة مستفيضة لأحكام النكاح.';
    }
    
    // Confetti if score >= 35 (70%)
    if (score >= 35 && typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
    
    showScreen(screenResult);
}

// ---- Event Listeners ----
playerPhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            playerPhotoUrl = event.target.result;
            avatarPreviewLabel.style.backgroundImage = `url(${playerPhotoUrl})`;
            avatarPreviewLabel.innerHTML = '';
            avatarPreviewLabel.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
});

btnStart.addEventListener('click', startGame);
btnNext.addEventListener('click', goNext);
btnPrev.addEventListener('click', goPrev);
btnSkip.addEventListener('click', skipQuestion);
btnRestart.addEventListener('click', startGame);
