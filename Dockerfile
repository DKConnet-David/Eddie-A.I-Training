FROM node:20-alpine

WORKDIR /app

# Copy server
COPY server.js .

# Copy static files into public/
COPY index.html public/
COPY css/ public/css/
COPY js/ public/js/
COPY playbooks/ public/playbooks/

# Create data directory
RUN mkdir -p /data

EXPOSE 3008

CMD ["node", "server.js"]
