"""Session management service for chat conversations."""

import uuid
from datetime import datetime
from typing import Optional
from google.adk.sessions import InMemorySessionService
from google.adk.events import Event

from api.models import ChatMessage, MessageRole, SessionInfo


class SessionService:
    """Manages chat sessions and conversation history."""

    def __init__(self):
        # Use ADK's built-in session service for agent state
        self.adk_session_service = InMemorySessionService()
        # Keep track of our own metadata
        self._sessions: dict[str, dict] = {}

    def create_session(self, name: Optional[str] = None) -> str:
        """Create a new chat session."""
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()

        self._sessions[session_id] = {
            "id": session_id,
            "name": name or f"Session {len(self._sessions) + 1}",
            "created_at": now,
            "updated_at": now,
            "messages": []
        }

        return session_id

    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session by ID."""
        return self._sessions.get(session_id)

    def get_or_create_session(self, session_id: Optional[str] = None) -> str:
        """Get existing session or create a new one."""
        if session_id and session_id in self._sessions:
            return session_id
        return self.create_session()

    def add_message(
        self,
        session_id: str,
        role: MessageRole,
        content: str,
        **kwargs
    ) -> ChatMessage:
        """Add a message to a session."""
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        message = ChatMessage(
            id=str(uuid.uuid4()),
            role=role,
            content=content,
            timestamp=datetime.utcnow(),
            **kwargs
        )

        session["messages"].append(message)
        session["updated_at"] = datetime.utcnow()

        return message

    def get_messages(self, session_id: str) -> list[ChatMessage]:
        """Get all messages for a session."""
        session = self._sessions.get(session_id)
        if not session:
            return []
        return session["messages"]

    def get_session_info(self, session_id: str) -> Optional[SessionInfo]:
        """Get session metadata."""
        session = self._sessions.get(session_id)
        if not session:
            return None

        return SessionInfo(
            id=session["id"],
            name=session["name"],
            created_at=session["created_at"],
            updated_at=session["updated_at"],
            message_count=len(session["messages"])
        )

    def list_sessions(self) -> list[SessionInfo]:
        """List all sessions."""
        return [
            SessionInfo(
                id=s["id"],
                name=s["name"],
                created_at=s["created_at"],
                updated_at=s["updated_at"],
                message_count=len(s["messages"])
            )
            for s in self._sessions.values()
        ]

    def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def get_conversation_context(self, session_id: str, max_messages: int = 10) -> str:
        """Get recent conversation context as a string for the agent."""
        messages = self.get_messages(session_id)
        recent = messages[-max_messages:] if len(messages) > max_messages else messages

        context_parts = []
        for msg in recent:
            role = "User" if msg.role == MessageRole.USER else "Assistant"
            context_parts.append(f"{role}: {msg.content}")

        return "\n".join(context_parts)


# Global session service instance
session_service = SessionService()
