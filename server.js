const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");
const {
    Server
} = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

const usersPasswords = {
    Jangdoyeul: "aa120305##",
    Woneunsup: "1234!!",
    Limsiu: "urmotherfucker2147483647"
};


app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// 루트 페이지 제공
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 저장된 데이터 반환
app.get("/data", (req, res) => {
    if (fs.existsSync("data.txt")) {
        const data = fs.readFileSync("data.txt", "utf8");
        res.send(data);
    } else {
        res.send("");
    }
});

io.on("connection", (socket) => {
    console.log("새로운 사용자가 접속했습니다!");

    let messages = [];

    // 기존 데이터 로드 (JSON 파싱 오류 방지)
    try {
        if (fs.existsSync("data.txt")) {
            const fileData = fs.readFileSync("data.txt", "utf8").trim();
            messages = fileData ? JSON.parse(fileData) : [];
        }
    } catch (error) {
        console.error("파일을 읽는 중 오류 발생:", error);
        messages = [];
    }

    console.log("현재 저장된 메시지 목록:", messages);

    // 접속한 사용자에게 기존 메시지 전송
    socket.emit("updateData", messages);

    // 클라이언트가 메시지 전송 시
    socket.on("sendData", (message) => {
        if (message.text.trim()) {
            const now = new Date();
            const formattedTime = now.toISOString(); // ISO 8601 형식으로 시간 저장

            // 시간 정보를 포함하여 메시지 객체 저장
            const messageWithTime = {
                ...message,
                time: formattedTime
            };

            messages.push(messageWithTime);

            try {
                fs.writeFileSync("data.txt", JSON.stringify(messages, null, 2), "utf8");
            } catch (error) {
                console.error("파일 저장 오류:", error);
            }

            console.log("새로운 메시지 추가됨:", message);

            io.emit("updateData", messages); // 클라이언트들에게 메시지 업데이트
        }
    });

    socket.on("deleteMessage", (messageIndex, user, password) => {
        // 비밀번호 검증
        if (usersPasswords[user] === password) {
            // 비밀번호가 맞으면 메시지 삭제
            messages.splice(messageIndex, 1); // 메시지 삭제

            // 파일에 변경 사항 저장
            try {
                fs.writeFileSync("data.txt", JSON.stringify(messages, null, 2), "utf8");
            } catch (error) {
                console.error("파일 저장 오류:", error);
            }

            io.emit("updateData", messages); // 삭제된 후 클라이언트에 업데이트 전송
        } else {
            socket.emit("error", "비밀번호가 틀렸습니다!");
        }
    });
    socket.on("disconnect", () => {
        console.log("사용자가 나갔습니다.");
    });
});




server.listen(PORT, () => console.log(`서버 실행: http://localhost:${PORT}`));
