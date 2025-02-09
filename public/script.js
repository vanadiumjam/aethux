const socket = io();

// 새로고침해도 비밀번호 & 라디오 버튼 선택 유지
document.getElementById("password").value = localStorage.getItem("password") || "";
const savedUser = localStorage.getItem("user");
if (savedUser) {
    document.querySelector(`input[name="user"][value="${savedUser}"]`).checked = true;
}

function sendData() {
    const text = document.getElementById("inputText").value;
    const password = document.getElementById("password").value;
    const user = document.querySelector('input[name="user"]:checked');

    // 사용자 선택 여부 확인
    if (!user) {
        alert("사용자를 선택하세요!");
        return;
    }

    // 비밀번호 검증
    const userValue = user.value;
    if ((userValue === "Jangdoyeul" && password !== "aa120305##") ||
        (userValue === "Woneunsup" && password !== "1234!!") ||
        (userValue === "Limsiu" && password !== "urmotherfucker2147483647")) {
        alert("비밀번호가 올바르지 않습니다!");
        return;
    }

    // 비밀번호 & 사용자 선택 저장 (새로고침 시 유지)
    localStorage.setItem("password", password);
    localStorage.setItem("user", userValue);

    if (!text.trim()){
        alert("내용을 입력하세요!");
        return;
    }

    if (text.length > 50) {
        alert("메시지는 50자 이내로 입력해주세요!");
        return;
    }

    const now = new Date();
    const time = now.toLocaleString("ko-KR", { hour12: false });

    const message = { user: userValue, text, time };
    socket.emit("sendData", message);

    document.getElementById("inputText").value = "";
}

function clearPassword() {
    localStorage.removeItem("password");
    document.getElementById("password").value = "";
    alert("저장된 비밀번호가 삭제되었습니다.");
}

socket.on("updateData", (messages) => {
    console.log("수신된 메시지 목록:", messages); // 디버깅용 로그

    const display = document.getElementById("displayData");

    // 사용자 정보 가져오기
    const currentUser = localStorage.getItem("user");

    // 메시지 목록을 HTML로 변환
    display.innerHTML = messages
        .map((msg, index) => {
            // 날짜 형식 변환 (ISO 8601 → MM/DD HH:mm:ss)
            const date = new Date(msg.time);
            const formattedTime = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

            return `
                <div style="display: flex; justify-content: flex-start; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: gray; margin-right: 10px;">${formattedTime}</span>
                    <strong>${msg.user}</strong> ${msg.text}
                    <button id="deleteBtn" onclick="deleteMessage(${index}, '${msg.user}')">삭제</button>
                </div>
            `;
        })
        .join("");

    // 새 메시지가 추가된 후 스크롤을 맨 아래로 이동
    display.scrollTop = display.scrollHeight;
});

// 메시지 삭제 함수
function deleteMessage(index, user) {
    const password = prompt("삭제를 위한 비밀번호를 입력하세요:");

    if (password) {
        socket.emit("deleteMessage", index, user, password); // 서버에 삭제 요청
    }
}

// 에러 처리
socket.on("error", (errorMessage) => {
    alert(errorMessage);
});


