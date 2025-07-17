#!/bin/bash
cd Frontend;
npm run dev &
cd ../Backend;
python3 handoff.py;