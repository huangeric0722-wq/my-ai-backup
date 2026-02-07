# Learning Log

## 2026-02-07

### [00:45 UTC] Architecture Trend: Generative World Models (Waymo)
*   **Source:** [Waymo Blog: The Waymo World Model](https://waymo.com/blog/2026/02/the-waymo-world-model-a-new-frontier-for-autonomous-driving-simulation)
*   **Topic:** Autonomous Driving, Generative AI, Simulation Architecture
*   **Key Findings:**
    *   **Gen-AI for Sim:** Waymo is using "Genie 3" (DeepMind) to generate 3D/Lidar worlds from 2D video or text.
    *   **Edge Case Training:** Solves the data scarcity problem for rare events (tornadoes, animals) by *hallucinating* them realistically for training.
    *   **Architecture Pattern:** "Video-to-Simulation" pipeline. Using a foundation model to synthesize sensor data (Lidar) that wasn't originally there.
*   **Relevance to Eric:**
    *   Relevant for "AI System Design" patterns.
    *   Shows shift from "Game Engine" simulation (Unity/Unreal) to "Generative Model" simulation.
