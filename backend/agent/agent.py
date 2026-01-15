"""Data Insights Agent - Main agent definition using Google ADK."""

import os
from google.adk.agents import Agent

from .config import settings
from .prompts import SYSTEM_INSTRUCTION
from .tools import CUSTOM_TOOLS

# Set environment variables for Vertex AI
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
os.environ["GOOGLE_CLOUD_PROJECT"] = settings.google_cloud_project
os.environ["GOOGLE_CLOUD_LOCATION"] = settings.google_cloud_region


def create_agent() -> Agent:
    """Create and configure the Data Insights Agent."""

    # Create the agent with Vertex AI model
    agent = Agent(
        name="data_insights_agent",
        model="gemini-3-flash-preview",
        description=(
            "A data insights assistant that helps users analyze BigQuery data "
            "using natural language. Converts questions to SQL, executes queries, "
            "and provides actionable insights."
        ),
        instruction=SYSTEM_INSTRUCTION,
        tools=CUSTOM_TOOLS,
    )

    return agent


# Create the root agent instance for ADK
root_agent = create_agent()
