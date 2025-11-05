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

    // 3 Tiers (แก้ไข: เปลี่ยน Emoji)
    const ITEMS = [
        { name: 'Common', symbol: '🪙', class: 'item-common', weight: 20 },      // 🪙 (Coin)
        { name: 'Rare', symbol: '🌟', class: 'item-rare', weight: 3 },        // 🌟 (Star)
        { name: 'Legendary', symbol: '💎', class: 'item-legendary', weight: 2 } // 💎 (Diamond)
    ];

    // --- 2. DOM Elements ---
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

    // --- 3. ฟังก์ชันหลัก ---

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

    /**
     * อัปเดตอนิเมชั่นเปิด
     */
    function revealChest(chestElement, item) {
        chestElement.classList.remove('shaking'); // (แก้ไข: เปลี่ยนจาก spinning)
        chestElement.innerHTML = '';
        chestElement.textContent = item.symbol;
        chestElement.classList.add(item.class); // item-common, item-rare, ฯลฯ
        chestElement.classList.add('item-reveal'); // (เพิ่มใหม่: อนิเมชั่น Pop)
        
        audioReveal.currentTime = 0;
        audioReveal.play();
    }

    /**
     * อัปเดตอนิเมชั่นและ Emoji
     */
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
            chest.textContent = '
            chest.className = 'chest'; // รีเซ็ตคลาสทั้งหมด
            chest.style.backgroundColor = ''; // (เพิ่มใหม่: รีเซ็ตสีพื้นหลัง)
            chest.classList.add('shaking'); // (แก้ไข: เปลี่ยนจาก spinning)
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
     * ตรวจสอบรางวัลและจ่ายโบนัส
     * (แก้ไข: เพิ่มการลบ .item-reveal ตอนรีเซ็ต)
     */
    function checkWinnings(results, betAmount) {
        const [r1, r2, r3] = results.map(item => item.name);
        const chests = [chest1, chest2, chest3];

        let bonus = 0;
        let message = '';
        resultMessage.className = ''; 

        // 3-of-a-kind
        if (r1 === r2 && r2 === r3) {
            if (r1 === 'Legendary') bonus = betAmount * 20;  // (💎)
            else if (r1 === 'Rare') bonus = betAmount * 10; // (🌟)
            else bonus = betAmount * 0.5; // (🪙 - Common)

            message = `แจ็คพอต! ได้ ${results[0].symbol} 3 อัน! +${bonus.toLocaleString()} ทอง!`;
            chests.forEach(c => c.classList.add('win-pop'));
        }
        // 2-of-a-kind (Tiered)
        else if (r1 === r2 || r2 === r3 || r1 === r3) {
            
            let doubledItemName = '';
            if (r1 === r2) doubledItemName = r1;
            else if (r2 === r3) doubledItemName = r2;
            else if (r1 === r3) doubledItemName = r1;

            if (doubledItemName === 'Legendary') {
                bonus = betAmount * 5; // (💎 สองอัน x5)
            } else if (doubledItemName === 'Rare') {
                bonus = betAmount * 2.5; // (🌟 สองอัน x2.5)
            } else if (doubledItemName === 'Common') {
                bonus = betAmount * 0.2; // (🪙 สองอัน x0.2)
            }

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
            // (แก้ไข: เพิ่มการลบ .item-reveal)
            chests.forEach(c => c.classList.remove('win-pop', 'item-reveal'));
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
