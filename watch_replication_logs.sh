#!/bin/bash
# Watch for copy trading replication activity in real-time

echo "🔍 Watching for copy trading replication logs..."
echo "Press Ctrl+C to stop"
echo ""
echo "Looking for:"
echo "  - Trade replication requests"
echo "  - Position close requests"  
echo "  - Trade execution results"
echo "  - Any errors related to follower account 101290"
echo ""
echo "=========================================="
echo ""

pm2 logs --lines 0 | grep -E "TRADE REPLICATION|replicate|101290|Sending OPEN|Sending CLOSE|Trade executed|Position closed|follower|COPY-PAMM|trading/replicate|trading/close" --color=always
