#!/bin/bash

# Public key from buyer's environment file
PUBLIC_KEY="02c7370bf416ee6e9f9a430a12869c456d93db6b7392a9f90d0db8981190f47153"

# Send a POST request to the proxy with the public key in the header
curl -v -X POST "http://127.0.0.1:3002" \
  -H "X-Public-Key: $PUBLIC_KEY" \
  -d '{"test":"message"}' 