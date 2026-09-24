import os
import base64
from dotenv import load_dotenv
from google import genai
from PIL import Image

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

with open("assets/images/ao-dai-1.png", "rb") as f:
    image_bytes = f.read()

interaction = client.interactions.create(
    model="gemini-3.1-flash-image",
    input=[
        {
          "type": "text",
          "text": "Create a picture of Vietnamese woman wearing this cloth."
        },
        {
            "type": "image",
            "data": base64.b64encode(image_bytes).decode('utf-8'),
            "mime_type": "image/png"
        }
    ],
)

with open("generated_image.png", "wb") as f:
    f.write(base64.b64decode(interaction.output_image.data))