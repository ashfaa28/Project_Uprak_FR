let video = document.getElementById("video"); // Membuat variabel video dengan mengambil elemen dari HTML yang id-nya adalah video
let canvas = document.body.appendChild(document.createElement("canvas")); // Menambahkan elemen canvas ke body dan menyimpannya dalam variabel
let ctx = canvas.getContext("2d"); // Membuat variabel untuk menangkap gambar dari objek yang terdeteksi oleh API
let displaySize;

// Ukuran resolusi kamera
let width = 1280;
let height = 720;

// Fungsi untuk mendapatkan daftar perangkat video yang tersedia
const getVideoDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
};

// Fungsi untuk mengambil gambar dari kamera
const startSteam = async (deviceId) => {
  console.log("----- START STREAM ------");
  const constraints = {
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: width },
      height: { ideal: height },
    },
    audio: false, // Menonaktifkan penggunaan audio
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Setel ukuran canvas berdasarkan ukuran video yang ditampilkan
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
    });
  } catch (err) {
    console.error("Error accessing media devices.", err);
  }
};

// Memuat model dan memulai stream dengan perangkat yang dipilih
const initialize = async () => {
  console.log(faceapi.nets);

  console.log("----- START LOAD MODEL ------");
  await Promise.all([
    faceapi.nets.ageGenderNet.loadFromUri("models"),
    faceapi.nets.ssdMobilenetv1.loadFromUri("models"),
    faceapi.nets.tinyFaceDetector.loadFromUri("models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("models"),
    faceapi.nets.faceExpressionNet.loadFromUri("models"),
  ]);

  const videoDevices = await getVideoDevices();
  if (videoDevices.length > 0) {
    startSteam(videoDevices[0].deviceId); // Mulai dengan kamera pertama
  } else {
    console.error("No video devices found.");
  }
};

initialize();

async function detect() {
  const detections = await faceapi
    .detectAllFaces(video)
    .withFaceLandmarks()
    .withFaceExpressions()
    .withAgeAndGender();

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Bersihkan canvas dengan ukuran yang benar
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  faceapi.draw.drawDetections(canvas, resizedDetections);
  faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

  resizedDetections.forEach((result) => {
    const { age, gender, genderProbability } = result;
    new faceapi.draw.DrawTextField(
      [
        `${Math.round(age)} Tahun`,
        `${gender} ${Math.round(genderProbability * 100)}%`,
      ],
      result.detection.box.bottomRight
    ).draw(canvas);
  });
}

video.addEventListener("play", () => {
  displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(detect, 100);
});
