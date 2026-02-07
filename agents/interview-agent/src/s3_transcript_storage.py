import json
import logging
import os
from typing import Optional
from pathlib import Path
import aioboto3

logger = logging.getLogger("s3-transcript-storage")


class S3TranscriptStorage:
    """S3 storage adapter for interview transcripts."""
    
    def __init__(self, company_id: int, interview_id: int, bucket_name: Optional[str] = None, region: Optional[str] = None):
        self.company_id = company_id
        self.interview_id = interview_id
        self.bucket_name = bucket_name or os.getenv("TRANSCRIPT_BUCKET")
        self.region = region or os.getenv("AWS_REGION", "us-east-1")
        self.enabled = bool(self.bucket_name)
        
        if not self.enabled:
            logger.info("S3 transcript storage disabled - no bucket configured")
        else:
            logger.info(f"S3 transcript storage enabled - bucket: {self.bucket_name}, region: {self.region}, company: {company_id}, interview: {interview_id}")
    
    def generate_s3_key(self, filename: str) -> str:
        """Generate S3 key using the structure: companies/{companyId}/interview/{interviewId}/{filename}"""
        return f"companies/{self.company_id}/interview/{self.interview_id}/{filename}"
    
    async def upload_file(self, local_file_path: str, s3_key: str) -> Optional[str]:
        """
        Upload a local file to S3.
        
        Args:
            local_file_path: Path to the local file to upload
            s3_key: S3 key where the file should be stored
            
        Returns:
            S3 key of the uploaded object, or None if upload failed or disabled
        """
        if not self.enabled:
            logger.warning("S3 upload skipped - storage not enabled")
            return None
            
        if not Path(local_file_path).exists():
            logger.error(f"Local file does not exist: {local_file_path}")
            return None
            
        try:
            logger.info(f"Uploading {local_file_path} to s3://{self.bucket_name}/{s3_key}")
            
            session = aioboto3.Session()
            async with session.client('s3', region_name=self.region) as s3:
                with open(local_file_path, 'rb') as file:
                    await s3.put_object(
                        Bucket=self.bucket_name,
                        Key=s3_key,
                        Body=file,
                        ContentType='application/json'
                    )
            
            logger.info(f"Successfully uploaded to s3://{self.bucket_name}/{s3_key}")
            return s3_key
            
        except Exception as e:
            logger.error(f"Error uploading to S3: {str(e)}")
            return None
    
    async def get_transcript_url(self, s3_key: str, expiry_seconds: int = 3600) -> Optional[str]:
        """Generate presigned URL for transcript access."""
        if not self.enabled:
            return None
            
        try:
            session = aioboto3.Session()
            async with session.client('s3', region_name=self.region) as s3:
                url = await s3.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': s3_key},
                    ExpiresIn=expiry_seconds
                )
                logger.info(f"Generated presigned URL for s3://{self.bucket_name}/{s3_key}")
                return url
            
        except Exception as e:
            logger.error(f"Error generating presigned URL: {str(e)}")
            return None 