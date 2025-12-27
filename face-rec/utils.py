import numpy as np
import matplotlib.pyplot as plt
import cv2
import psycopg2
import json
from sklearn.preprocessing import Normalizer


def get_encode(face_encoder, face, size):
    face = normalize(face)
    face = cv2.resize(face, size)
    encode = face_encoder.predict(
        np.expand_dims(face, axis=0),
        verbose=0
    )[0]
    return encode


def get_face(img, box):
    x1, y1, width, height = box
    x1, y1 = abs(x1), abs(y1)
    x2, y2 = x1 + width, y1 + height
    face = img[y1:y2, x1:x2]
    return face, (x1, y1), (x2, y2)


l2_normalizer = Normalizer('l2')


def normalize(img):
    mean, std = img.mean(), img.std()
    return (img - mean) / (std + 1e-8)


def load_encodings_from_db(
    host="localhost",
    database="face_recognition",
    user="postgres",
    password="",
    port=5432
):
    """
    Load face encodings from PostgreSQL
    Return: dict {nim: np.array(embedding)}
    """

    try:
        conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password,
            port=port
        )
        cursor = conn.cursor()
        
        # Hanya ambil user yang sudah punya embedding
        cursor.execute("SELECT nim, face_embedding FROM users WHERE face_embedding IS NOT NULL")
        rows = cursor.fetchall()

        encoding_dict = {}
        for nim, embedding in rows:
            # Jika kolom JSONB di Postgres, kadang perlu diparsing manual tergantung versi psycopg2
            if isinstance(embedding, str):
                emb_list = json.loads(embedding)
            else:
                emb_list = embedding # Sudah berupa list/array
            
            encoding_dict[nim] = np.array(emb_list, dtype=np.float32)

        cursor.close()
        conn.close()

        print(f"✅ Berhasil memuat {len(encoding_dict)} identitas wajah dari database.")
        return encoding_dict

    except Exception as e:
        print(f"❌ Gagal memuat data dari database: {e}")
        return {}

def plt_show(cv_img):
    img_rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
    plt.imshow(img_rgb)
    plt.axis("off")
    plt.show()

def read_vc(vc, func_to_call, break_print=':(', show=False, win_name='Face Scanner', break_key='q', **kwargs):
    while vc.isOpened():
        ret, frame = vc.read()
        if not ret:
            print(break_print)
            break

        res = func_to_call(frame, **kwargs)
        
        display_frame = res if res is not None else frame

        if show:
            cv2.imshow(win_name, display_frame)

        if cv2.waitKey(1) & 0xff == ord(break_key):
            break
    
    vc.release()
    cv2.destroyAllWindows()