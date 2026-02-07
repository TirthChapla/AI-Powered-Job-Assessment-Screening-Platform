# Connect to the EC2 instance 
ssh -i "vh-ec2-kp.pem" ec2-user@ec2-35-87-232-189.us-west-2.compute.amazonaws.com

# Update files on the EC2 instance
scp -i "E:\Aws\vh\key-pairs\vh-ec2-kp.pem" -r "E:\Work\voice-hire\agents\vh-faq-agent\livekit-agent\src" ec2-user@ec2-35-87-232-189.us-west-2.compute.amazonaws.com:~
scp -i "E:\Aws\vh\key-pairs\vh-ec2-kp.pem" -r "E:\Work\voice-hire\agents\vh-faq-agent\livekit-agent\knowledge-base" ec2-user@ec2-35-87-232-189.us-west-2.compute.amazonaws.com:~
scp -i "E:\Aws\vh\key-pairs\vh-ec2-kp.pem" "E:\Work\voice-hire\agents\vh-faq-agent\livekit-agent\requirements.txt" ec2-user@ec2-35-87-232-189.us-west-2.compute.amazonaws.com:~

# Start the livekit agent on the EC2 instance
sudo systemctl start livekit-agent.service

# Stop the livekit agent on the EC2 instance
sudo systemctl stop livekit-agent.service

# Restart the livekit agent on the EC2 instance
sudo systemctl restart livekit-agent.service

# Watch the logs of the livekit agent on the EC2 instance
sudo journalctl -u livekit-agent.service -f

# Check the status of the livekit agent on the EC2 instance
sudo systemctl status livekit-agent.service

# Check only error logs of the livekit agent on the EC2 instance
sudo journalctl -u livekit-agent.service -p err