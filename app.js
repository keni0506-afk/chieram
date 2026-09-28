const bootScreen = document.querySelector("#bootScreen");
const app = document.querySelector("#app");
const speechText = document.querySelector("#speechText");
const speakButton = document.querySelector("#speakButton");
const stopButton = document.querySelector("#stopButton");
const speed = document.querySelector("#speed");
const pitch = document.querySelector("#pitch");
const speedValue = document.querySelector("#speedValue");
const pitchValue = document.querySelector("#pitchValue");
const message = document.querySelector("#message");

const synth = window.speechSynthesis;
let voices = [];

function finishBoot() {
  bootScreen.classList.add("is-complete");
  app.classList.add("is-ready");
}

function setMessage(text, state = "") {
  message.textContent = text;
  message.className = `message${state ? ` is-${state}` : ""}`;
}

function updateRange(range, output, suffix = "") {
  const min = Number(range.min);
  const max = Number(range.max);
  const current = Number(range.value);
  const percentage = ((current - min) / (max - min)) * 100;

  range.style.setProperty("--fill", `${percentage}%`);
  output.value = `${current.toFixed(1)}${suffix}`;
  output.textContent = `${current.toFixed(1)}${suffix}`;
}

function loadVoices() {
  voices = synth?.getVoices() ?? [];
}

function selectJapaneseVoice() {
  const japaneseVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ja"));
  if (!japaneseVoices.length) return null;

  const preferredNames = ["kyoko", "nanami", "haruka", "sayaka", "female"];
  return japaneseVoices.find((voice) =>
    preferredNames.some((name) => voice.name.toLowerCase().includes(name))
  ) ?? japaneseVoices.find((voice) => voice.localService) ?? japaneseVoices[0];
}

function speak() {
  const text = speechText.value.trim();

  if (!text) {
    setMessage("文章を入力してください", "error");
    speechText.focus();
    return;
  }

  if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
    setMessage("このブラウザでは音声読み上げを利用できません", "error");
    return;
  }

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = Number(speed.value);
  utterance.pitch = Number(pitch.value);

  const voice = selectJapaneseVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => setMessage("音声を送信中…", "active");
  utterance.onend = () => setMessage("送信完了 — 音声モジュール待機中");
  utterance.onerror = (event) => {
    if (event.error !== "canceled" && event.error !== "interrupted") {
      setMessage("読み上げを開始できませんでした", "error");
    }
  };

  // iOS Safariではユーザー操作の中で直接speakを呼び出す必要があります。
  synth.speak(utterance);
}

function stop() {
  if (!synth) return;
  synth.cancel();
  setMessage("停止しました — 音声モジュール待機中");
}

speed.addEventListener("input", () => updateRange(speed, speedValue, "x"));
pitch.addEventListener("input", () => updateRange(pitch, pitchValue));
speakButton.addEventListener("click", speak);
stopButton.addEventListener("click", stop);

updateRange(speed, speedValue, "x");
updateRange(pitch, pitchValue);
loadVoices();

if (synth) {
  synth.addEventListener?.("voiceschanged", loadVoices);
  synth.onvoiceschanged = loadVoices;
}

window.addEventListener("pagehide", () => synth?.cancel());
window.setTimeout(finishBoot, 1150);
