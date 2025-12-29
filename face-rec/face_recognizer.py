import time
import requests
import cv2
import mtcnn
import numpy as np
from keras.models import load_model
from scipy.spatial.distance import cosine
from utils import *

API_URL = "http://localhost:3000/api/gate/screen"
COOLDOWN_TIME = 10
last_scanned = {}

def send_to_backend(embedding, nim):
    try:
        payload = {"embedding": embedding.tolist()}
        response = requests.post(API_URL, json=payload)
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"✅ [BACKEND] {nim} Berhasil: {data.get('type')} - {data.get('status')}")
            return data
        else:
            print(f"❌ [BACKEND] Gagal: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"⚠️ [BACKEND] Koneksi Error: {e}")
    return None

def recognize(img, detector, encoder, encoding_dict, recognition_t=0.2, confidence_t=0.99, required_size=(160, 160)):
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = detector.detect_faces(img_rgb)

    for res in results:
        if res['confidence'] < confidence_t:
            continue

        face, pt_1, pt_2 = get_face(img_rgb, res['box'])
        encode = get_encode(encoder, face, required_size)
        encode = l2_normalizer.transform(encode.reshape(1, -1))[0]

        name = 'unknown'
        distance = float("inf")

        for db_name, db_encode in encoding_dict.items():
            db_vec = np.array(db_encode).flatten()
            if db_vec.shape != encode.shape: continue
            
            dist = cosine(db_vec, encode)
            if dist < recognition_t and dist < distance:
                name = db_name
                distance = dist
        
        current_time = time.time()
        
        if name != 'unknown':
            # cek apakah user ini baru saja di-scan
            last_time = last_scanned.get(name, 0)
            
            if current_time - last_time > COOLDOWN_TIME:
                print(f"🚀 Memproses scan untuk NIM: {name}")

                result = send_to_backend(encode, name)                
                # update waktu scan terakhir
                last_scanned[name] = current_time
                
                # info dari Backend
                if result:
                    status_text = f"{result.get('type')} - {result.get('status')}"
                    cv2.putText(img, status_text, (pt_1[0], pt_2[1] + 25), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            else:
                # masih dalam masa tunggu cooldown
                cv2.putText(img, "WAIT...", (pt_1[0], pt_1[1] - 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        # visualisasi 
        color = (0, 255, 0) if name != 'unknown' else (0, 0, 255)
        cv2.rectangle(img, pt_1, pt_2, color, 2)
        cv2.putText(img, f"{name} ({distance:.2f})", (pt_1[0], pt_1[1] - 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    return img


if __name__ == '__main__':
    encoder_model = 'facenet_keras.h5'
    face_detector = mtcnn.MTCNN()
    face_encoder = load_model(encoder_model)
    encoding_dict = load_encodings_from_db()

    vc = cv2.VideoCapture(0)
    while vc.isOpened():
        ret, frame = vc.read()
        if not ret:
            break

        frame = recognize(frame, face_detector, face_encoder, encoding_dict)
        cv2.imshow('camera', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    vc.release()
    cv2.destroyAllWindows()
