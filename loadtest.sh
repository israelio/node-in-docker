# install with vegata with:
# brew update && brew install vegeta
echo "GET http://localhost:8000" | vegeta attack -duration 0 -rate 10000 > /dev/null
