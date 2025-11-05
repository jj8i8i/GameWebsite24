document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ฐานข้อมูลและสถานะเกม ---
    const ACCOUNTS_DB = {
        "test1": { password: "test1" }, "test2": { password: "test2" },
        "test3": { password: "test3" }, "test4": { password: "test4" },
        "test5": { password: "test5" }
    };
    const userWallet = {
        "test1": 100000000, "test2": 100000000, "test3": 100000000,
        "test4": 100000000, "test5": 100000000
    };
    let currentUser = null;

    // --- *** นี่คือส่วนที่แก้ไข (3 Tiers) *** ---
    const ITEMS = [
        // Tier 1: Common - (B)
        { 
            name: 'Common', 
            symbol: 'B',
            class: 'item-common', // (B จะใช้สีเทา/เงิน จาก css)
            weight: 20 
        },
        // Tier 2: Rare - (A)
        { 
            name: 'Rare', 
            symbol: 'A',
            class: 'item-rare', // (A จะใช้สีแดง จาก css)
            weight: 3
        },
        // Tier 3: Legendary - (7)
        { 
            name: 'Legendary', 
            symbol: '7',
            class: 'item-legendary', // (7 จะใช้สีทอง จาก css)
            weight: 2
        }
    ];
    // --- จบส่วนที่แก้ไข ---


    // --- 2. DOM Elements (เหมือนเดิม) ---
    const loginContainer = document.getElementById('login-container');
    const gameContainer = document.getElementById('game-container');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const welcomeMessage = document.getElementById('welcome-message');
    const goldDisplay = document.getElementById('gold-display');
    const logoutButton = document.getElementById('logout-button');
    const chest1 = document.getElementById('chest1');
    const chest2 = document.getElementById('chest2');
    const chest3 = document.getElementById('chest3');
    const betInput = document.getElementById('bet-input');
    const openButton = document.getElementById('open-button');
    const resultMessage = document.getElementById('result-message');
    const audioSpin = document.getElementById('audio-spin');
    const audioWin = document.getElementById('audio-win');
    const audioLose = document.getElementById('audio-lose');
    const audioReveal = document.getElementById('audio-reveal');

    // --- 3. ฟังก์ชันหลัก (เหมือนเดิม) ---

    function updateGoldDisplay(didWin = false) {
        if (currentUser) {
            goldDisplay.textContent = `ทอง: ${userWallet[currentUser].toLocaleString()}`;
            if (didWin) {
                goldDisplay.classList.add('gold-flash');
                setTimeout(() => { goldDisplay.classList.remove('gold-flash'); }, 700);
            }
        }
    }

    function handleLogin() {
        const username = usernameInput.value;
        const password = passwordInput.value;
        if (ACCOUNTS_DB[username] && ACCOUNTS_DB[username].password === password) {
            currentUser = username;
            loginError.textContent = '';
            usernameInput.value = ''; passwordInput.value = '';
            loginContainer.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            welcomeMessage.textContent = `ยินดีต้อนรับ, ${currentUser}`;
            updateGoldDisplay();
        } else {
            loginError.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        }
    }

    function handleLogout() {
        currentUser = null;
        loginContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
    }

    function getRandomItem() {
        const weightedList = [];
        ITEMS.forEach(item => {
            for (let i = 0; i < item.weight; i++) {
                weightedList.push(item);
            }
        });
        const randomIndex = Math.floor(Math.random() * weightedList.length);
        return weightedList[randomIndex];
    }

    function revealChest(chestElement, item) {
        chestElement.classList.remove('spinning');
        chestElement.innerHTML = '';
        chestElement.textContent = item.symbol;
        chestElement.classList.add(item.class);
        audioReveal.currentTime = 0;
        audioReveal.play();
    }

    function handleOpenChest() {
        const betAmount = parseInt(betInput.value, 10);
        if (isNaN(betAmount) || betAmount <= 0) {
            resultMessage.textContent = 'กรุณาใส่ค่ากุญแจที่ถูกต้อง';
            return;
        }
        if (userWallet[currentUser] < betAmount) {
            resultMessage.textContent = 'คุณมีทองไม่เพียงพอ!';
            return;
        }

        openButton.disabled = true;
        resultMessage.textContent = 'กำลังเปิดหีบ...';
        resultMessage.className = '';
        audioSpin.currentTime = 0;
        audioSpin.play();
        userWallet[currentUser] -= betAmount;
        updateGoldDisplay(false);

        const results = [getRandomItem(), getRandomItem(), getRandomItem()];
        const chests = [chest1, chest2, chest3];

        chests.forEach(chest => {
            chest.innerHTML = '';
            chest.textContent = '❓';
            chest.className = 'chest';
            chest.classList.add('spinning');
        });

        setTimeout(() => { revealChest(chests[0], results[0]); }, 700);
        setTimeout(() => { revealChest(chests[1], results[1]); }, 1400);
        setTimeout(() => { revealChest(chests[2], results[2]); }, 2100);

        setTimeout(() => {
            audioSpin.pause();
            checkWinnings(results, betAmount);
            openButton.disabled = false;
        }, 2500);
    }

    /**
     * *** (ปรับเงินรางวัลสำหรับ 3 Tiers) ***
     * ตรวจสอบรางวัลและจ่ายโบนัส
     */
    function checkWinnings(results, betAmount) {
        const [r1, r2, r3] = results.map(item => item.name);
        const chests = [chest1, chest2, chest3];

        let bonus = 0;
        let message = '';
        resultMessage.className = ''; 

        // 3-of-a-kind
        if (r1 === r2 && r2 === r3) {
            // --- อัปเดตตัวคูณรางวัล ---
            if (r1 === 'Legendary') bonus = betAmount * 20;  // (7)
            else if (r1 === 'Rare') bonus = betAmount * 10; // (A)
            else bonus = betAmount * 0.5; // (B - Common)
            // ---

            message = `แจ็คพอต! ได้ ${results[0].symbol} 3 อัน! +${bonus.toLocaleString()} ทอง!`;
            chests.forEach(c => c.classList.add('win-pop'));
        }
        // 2-of-a-kind
        else if (r1 === r2 || r2 === r3 || r1 === r3) {
            bonus = betAmount * 0.2; // (ได้คืน 20%)
            message = `ได้ 2 อัน! +${bonus.toLocaleString()} ทอง!`;
            
            if (r1 === r2) [chests[0], chests[1]].forEach(c => c.classList.add('win-pop'));
            if (r2 === r3) [chests[1], chests[2]].forEach(c => c.classList.add('win-pop'));
            if (r1 === r3) [chests[0], chests[2]].forEach(c => c.classList.add('win-pop'));
        }
        // ไม่ได้รางวัล
        else {
            message = 'ไม่ได้รางวัลเลย ลองใหม่อีกครั้ง!';
        }

        // จ่ายโบนัส / เล่นเสียง
        if (bonus > 0) {
            userWallet[currentUser] += bonus;
            if (bonus < betAmount) {
                audioLose.play();
            } else {
                audioWin.play();
            }
            updateGoldDisplay(bonus >= betAmount);
            
            if (bonus >= betAmount) {
                resultMessage.classList.add('win-message');
            } else {
                resultMessage.classList.add('lose-message');
            }
        } else {
            audioLose.play();
            resultMessage.classList.add('lose-message');
        }

        resultMessage.textContent = message;

        setTimeout(() => {
            chests.forEach(c => c.classList.remove('win-pop'));
        }, 500);
    }

    // --- 4. Event Listeners ---
    loginButton.addEventListener('click', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    openButton.addEventListener('click', handleOpenChest);
    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });

});
