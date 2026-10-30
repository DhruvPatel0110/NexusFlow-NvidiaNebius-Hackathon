import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import gradio as gr
import uvicorn
from app.main import app as fastapi_app

# Landing page banner on port 7860 for Hugging Face Spaces
with gr.Blocks(title="NexusFlow Intelligence API") as demo:
    gr.Markdown("# 🌐 NexusFlow Supply Chain Intelligence API")
    gr.Markdown(
        "Real-time AI supply-chain disruption intelligence engine "
        "powered by **NVIDIA Nemotron** (`nvidia/nemotron-3-super-120b-a12b`) on **Nebius Token Factory**."
    )
    with gr.Row():
        gr.Markdown("👉 **[Interactive Swagger API Documentation](/docs)**")
        gr.Markdown("👉 **[System Health Telemetry](/health)**")
        gr.Markdown("👉 **[Geographic Hotspots JSON](/api/master_graph/hotspots)**")
        gr.Markdown("👉 **[Master Supply Chain Graph](/api/master_graph)**")

# Mount FastAPI app onto root so all REST endpoints (/api/..., /health, /docs) are accessible
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)

