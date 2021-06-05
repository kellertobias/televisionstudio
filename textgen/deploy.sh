SERVER="rack-video"
echo "===================="
echo "= CLEANUP LOCALLY  ="
echo "===================="
echo "rm -rf node_modules" && rm -rf node_modules
echo "rm -rf client/fonts" && rm -rf client/fonts
echo ""
echo "===================="
echo "= CLEANUP REMOTELY ="
echo "===================="
ssh -T $SERVER << EOF
echo "-------------------------------------------------"
echo "cd /opt/textgen" && cd /opt/textgen
pwd
ls -lach
echo "rm -rf textgen" && rm -rf textgen
EOF

echo "===================="
echo "= UPLOADING CODE   ="
echo "===================="
echo "(cd .. && scp -r ./textgen $SERVER:/opt/textgen)" && (cd .. && scp -r ./textgen $SERVER:/opt/textgen)

echo "===================="
echo "= INSTALL REMOTELY ="
echo "===================="
ssh -T $SERVER << EOF
echo "-------------------------------------------------"
echo "cd /opt/textgen" && cd /opt/textgen
pwd
ls -lach
echo "docker-compose build" && docker-compose build
docker-compose up -d

EOF

