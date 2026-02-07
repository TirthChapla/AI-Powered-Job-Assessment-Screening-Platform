import logging
from typing import Optional
from livekit import rtc

logger = logging.getLogger("participant-logger")


class ParticipantLogger:
    """
    Handles detailed logging of participant information and track publications.
    Focused on subscription events and participant state tracking.
    """
    
    def __init__(self):
        self.room: Optional[rtc.Room] = None
    
    def setup_track_publication_monitoring(self, room: rtc.Room) -> None:
        """Set up monitoring for track publication events in the room."""
        self.room = room
        
        # Monitor track subscription events
        room.on("track_subscribed", self._on_track_subscribed)
        room.on("track_unsubscribed", self._on_track_unsubscribed)
        room.on("track_subscription_failed", self._on_track_subscription_failed)
        room.on("track_published", self._on_track_published)
        room.on("track_unpublished", self._on_track_unpublished)
        
        logger.info("Track publication monitoring setup completed")
    
    def log_deep_participant_details(self, participant) -> None:
        """Log comprehensive participant details with focus on publications."""
        logger.info("=" * 60)
        logger.info(f"PARTICIPANT DETAILS FOR: {participant.identity}")
        logger.info("=" * 60)
        
        # Basic participant info
        logger.info(f"Identity: {participant.identity}")
        logger.info(f"Name: {participant.name}")
        logger.info(f"Kind: {participant.kind}")
        # logger.info(f"Connection Quality: {participant.connection_quality}")
        
        # Participant type specific info
        if isinstance(participant, rtc.RemoteParticipant):
            logger.info("Type: Remote Participant")
        elif isinstance(participant, rtc.LocalParticipant):
            logger.info("Type: Local Participant")
        else:
            logger.info(f"Type: {type(participant).__name__}")
        
        # Track publications
        self._log_track_publications(participant)
        
        # Additional metadata if available
        if hasattr(participant, 'metadata') and participant.metadata:
            logger.info(f"Metadata: {participant.metadata}")
        
        logger.info("=" * 60)
    
    def _log_track_publications(self, participant) -> None:
        """Log detailed information about track publications."""
        logger.info(f"TRACK PUBLICATIONS ({len(participant.track_publications)} total):")
        
        if not participant.track_publications:
            logger.info("  No track publications found")
            return
        
        for sid, publication in participant.track_publications.items():
            self._log_single_publication(publication, "  ")
    
    def _log_single_publication(self, publication: rtc.TrackPublication, indent: str = "") -> None:
        """Log details of a single track publication."""
        logger.info(f"{indent}Publication SID: {publication.sid}")
        logger.info(f"{indent}Name: {publication.name}")
        logger.info(f"{indent}Kind: {publication.kind}")
        logger.info(f"{indent}Source: {publication.source}")
        logger.info(f"{indent}Muted: {publication.muted}")
        logger.info(f"{indent}Subscribed: {publication.subscribed}")
        
        if hasattr(publication, 'dimensions') and publication.dimensions:
            logger.info(f"{indent}Dimensions: {publication.dimensions.width}x{publication.dimensions.height}")
        
        if hasattr(publication, 'mime_type') and publication.mime_type:
            logger.info(f"{indent}MIME Type: {publication.mime_type}")
        
        if hasattr(publication, 'track') and publication.track:
            logger.info(f"{indent}Track: {publication.track}")
            logger.info(f"{indent}Track SID: {publication.track.sid}")
        else:
            logger.info(f"{indent}Track: Not available")
        
        logger.info(f"{indent}---")
    
    def _on_track_subscribed(self, track, publication, participant) -> None:
        """Handle track subscription events."""
        logger.info(f"TRACK SUBSCRIBED: {participant.identity}")
        logger.info(f"  Track: {track.sid} ({publication.name})")
        logger.info(f"  Kind: {publication.kind}")
        logger.info(f"  Source: {publication.source}")
    
    def _on_track_unsubscribed(self, track, publication, participant) -> None:
        """Handle track unsubscription events."""
        logger.info(f"TRACK UNSUBSCRIBED: {participant.identity}")
        logger.info(f"  Track: {track.sid} ({publication.name})")
        logger.info(f"  Kind: {publication.kind}")
    
    def _on_track_subscription_failed(self, track_sid, participant, error) -> None:
        """Handle track subscription failure events."""
        logger.warning(f"TRACK SUBSCRIPTION FAILED: {participant.identity}")
        logger.warning(f"  Track SID: {track_sid}")
        logger.warning(f"  Error: {error}")
    
    def _on_track_published(self, publication, participant) -> None:
        """Handle track publication events."""
        logger.info(f"TRACK PUBLISHED: {participant.identity}")
        logger.info(f"  Publication: {publication.sid} ({publication.name})")
        logger.info(f"  Kind: {publication.kind}")
        logger.info(f"  Source: {publication.source}")
    
    def _on_track_unpublished(self, publication, participant) -> None:
        """Handle track unpublication events."""
        logger.info(f"TRACK UNPUBLISHED: {participant.identity}")
        logger.info(f"  Publication: {publication.sid} ({publication.name})")
        logger.info(f"  Kind: {publication.kind}") 