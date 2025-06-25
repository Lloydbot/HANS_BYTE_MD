FROM node:lts-buster

# Clone your GitHub repository into /root/hansbyte
RUN git clone https://github.com/HaroldMth/HANS_BYTE_MD_MD /root/hansbyte

# Set working directory
WORKDIR /root/hansbyte

# Install dependencies and pm2 globally
RUN npm install && npm install -g pm2

# Expose the port your app listens on
EXPOSE 9090

# Start the app
CMD ["npm", "start"]
