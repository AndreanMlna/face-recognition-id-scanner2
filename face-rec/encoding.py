import os
import pickle
import numpy as np
import cv2
import mtcnn
from keras.models import load_model
from utils import get_face, get_encode, l2_normalizer, normalize

encoder_model = 'facenet_keras.h5'
people_dir = 'data/Faces'
encodings_path = 'encodings/encodings.pkl'
required_size = (160, 160)

face_detector = mtcnn.MTCNN()
face_encoder = load_model(encoder_model)

encoding_dict = {}

print("Memulai proses pembuatan encodings...")

for person_name in os.listdir(people_dir):
    person_dir = os.path.join(people_dir, person_name)
    if not os.path.isdir(person_dir):
        continue

    print(f"Memproses {person_name}...")
    encodes = []

    for img_name in os.listdir(person_dir):
        img_path = os.path.join(person_dir, img_name)
        img = cv2.imread(img_path)

        if img is None:
            print(f"gagal membaca gambar: {img_name}")
            continue

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_detector.detect_faces(img_rgb)

        if results:
            res = max(results, key=lambda b: b['box'][2] * b['box'][3])
            face, _, _ = get_face(img_rgb, res['box'])

            face = normalize(face)
            face = cv2.resize(face, required_size)
            encode = face_encoder.predict(np.expand_dims(face, axis=0))[0]
            encodes.append(encode)

    if len(encodes) == 0:
        print(f"Tidak ada wajah terdeteksi untuk {person_name}")
        continue

    encode = np.sum(encodes, axis=0)
    encode = l2_normalizer.transform(np.expand_dims(encode, axis=0))[0]
    encoding_dict[person_name] = encode

os.makedirs(os.path.dirname(encodings_path), exist_ok=True)
with open(encodings_path, 'wb') as file:
    pickle.dump(encoding_dict, file)

print("\n encodings.pkl berhasil dibuat!")
print(f"Lokasi: {encodings_path}")
print("Daftar nama yang berhasil disimpan:", list(encoding_dict.keys()))
