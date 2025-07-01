import React, { useState, useRef, useEffect} from "react";

const UploadSection = () => {
  const [file, setFile] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [fillerCounts, setFillerCounts] = useState(null);
  const [gazeData, setGazeData] = useState(null);
  const [toneData, setToneData] = useState(null);
  const [bodyLanguage, setBodyLanguage] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(styleTag);
  return () => document.head.removeChild(styleTag);
}, []);


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setSlides(data.image_urls || []);
      setCurrentSlide(0);
      setFillerCounts(null);
      setAnalysis("");
      setVideoUrl(null);
      setGazeData(null);
    } catch (error) {
      console.error("Yükleme hatası:", error);
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    mediaStreamRef.current = stream;
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm" });
    recordedChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);

      const formData = new FormData();
      formData.append("video", blob, "presentation.webm");

      setLoadingAnalysis(true); // analiz başlıyor
      fetch("http://localhost:8000/upload_video/", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          setAnalysis(data.analysis || "Sunum analizi alınamadı.");
          setFillerCounts(data.filler_counts || null);
          setGazeData(data.gaze || null);
          setToneData(data.tone || null);
          setBodyLanguage(data.body_language || null);

        })
        .catch((err) => {
          console.error("Video yükleme hatası:", err);
          setAnalysis("Video yüklenemedi.");
        })
        .finally(() => {
        setLoadingAnalysis(false); // 🔵 Analiz tamamlandı
      });
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  return (
  <>
    {/* Üst Bar - Logo + Başlık */}
    <div
      style={{
        backgroundColor: "white",
        padding: "0.00005rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 1000,

      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
        <img src="/logo3.png" alt="Logo" style={{ width:"100px", height: "auto" }} />
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#333" }}>Sunum Koçu AI</h1> 
      </div>
    </div>

    {/* Arka Planlı Gövde */}
    <div
      style={{
        backgroundImage: `url("/arkaplanfoto.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "150vh",
        fontFamily: "Arial, sans-serif",
        padding: "4rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "3rem",
          marginTop: "5rem",
          flexWrap: "wrap",
        }}
      >
        {/* 📄 Sunum Yükleme Kutusu */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            width: "450px",
          }}
        >
          <h2>📄 Sunum Yükle</h2>
          <p style={{ fontSize: "0.9rem", color: "black" }}>
            Yüklemek istediğiniz PowerPoint dosyasını seçin.
          </p>
          <input type="file" accept=".pptx,.pdf" onChange={handleFileChange} />
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              backgroundColor: uploading ? "#ccc" : "#4CAF50",
              color: "white",
              padding: "0.6rem 1.2rem",
              border: "none",
              borderRadius: "8px",
              cursor: uploading ? "default" : "pointer",
            }}
          >
            {uploading ? "Yükleniyor..." : "Yükle ve Göster"}
          </button>

          {slides.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3>🎞️ Slayt Gösterimi</h3>
              <img
                src={slides[currentSlide]}
                alt={`Slayt ${currentSlide + 1}`}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                }}
              />
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button onClick={() => setCurrentSlide((p) => Math.max(p - 1, 0))} disabled={currentSlide === 0}>
                  ◀️
                </button>
                <span>
                  {currentSlide + 1} / {slides.length}
                </span>
                <button
                  onClick={() => setCurrentSlide((p) => Math.min(p + 1, slides.length - 1))}
                  disabled={currentSlide === slides.length - 1}
                >
                  ▶️
                </button>
              </div>
            </div>
          )}
          {analysis &&(
              <div
                style={{
                  marginTop: "5rem",
                  backgroundColor: "#f1f1f1",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
          
          {fillerCounts && (
                <div
                  style={{
                    marginTop: "1rem",
                    backgroundColor: "#e0f7fa",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    color: "#007b7f",
                    fontWeight: "bold",
                  }}
                >
                  Dolgu kelimeleri sayısı:{" "}
                  {Object.entries(fillerCounts)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")}
                </div>
              )}
              {gazeData && (
                <div
                  style={{
                    marginTop: "1rem",
                    backgroundColor: "#fff3cd",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    color: "#856404",
                    fontWeight: "bold",
                  }}
                >
                  👀 Kameraya Bakma Analizi: <br />
                  Toplam bakış sayısı: {gazeData.gaze_count} <br />
                  Ortalama bakış süresi: {gazeData.total_gaze_time_sec}s
                </div>
              )}

              {toneData && (
                <div
                  style={{
                    marginTop: "1rem",
                    backgroundColor: "#e8f5e9",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    color: "#2e7d32",
                    fontWeight: "bold",
                  }}
                >
                  🎼 Ses Tonu Değerlendirmesi: <br />
                  {toneData.summary}
                  <ul
                    style={{
                      paddingLeft: "1.2rem",
                      marginTop: "0.5rem",
                      color: "#2e7d32",
                      fontWeight: "normal",
                    }}
                  >
                    {toneData.suggestions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bodyLanguage && (
                <div
                  style={{
                    marginTop: "1rem",
                    backgroundColor: "#fce4ec",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    color: "#880e4f",
                    fontWeight: "bold",
                  }}
                >
                  🕴️ Beden Dili ve Duruş Analizi: <br />
                  {bodyLanguage}
                </div>
              )}
 
        </div>
         )}
 </div>
            
        {/* 🎤 Sunum Kaydı Kutusu */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            width: "450px",
            

          }}
        >
          <h2>🎤 Sunum Kaydı</h2>
          <p style={{ fontSize: "0.9rem", color: "black" }}>
            Kameranızı ve mikrofonunuzu kullanarak sunum yapın.
          </p>
          {!recording ? (
            <button
              onClick={startRecording}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "0.6rem 1.2rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Sunuma Başla
            </button>
          ) : (
            <button
              onClick={stopRecording}
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                padding: "0.6rem 1.2rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Sunumu Bitir
            </button>
          )}

          {videoUrl && (
            <div style={{ marginTop: "1rem" }}>
              <h3>📹 Kayıt Önizlemesi</h3>
              <video src={videoUrl} controls style={{ width: "100%", borderRadius: "15px" }} />
            </div>
          )}

          {loadingAnalysis && (
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#007bff",
              }}
            >
              <div className="spinner" />
              GPT analizi yapılıyor...
            </div>
          )}

          {analysis && (
            <div
              style={{
                marginTop: "2rem",
                backgroundColor: "#f1f1f1",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <h3>🤖 Sunum Analizi</h3>
              <p style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", color: "#333" }}>{analysis}</p>

              
              

            </div>
          )}
        </div>
      </div>
    </div>
  </>
);

};

export default UploadSection;
