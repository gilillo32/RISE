# init.sh
set -e

mongosh <<EOF
use rise
db.createUser({
  user: '$MONGO_USER',
  pwd:  '$MONGO_PASS',
  roles: [{
    role: 'readWrite',
    db: '$DB_NAME'
  }]
})
EOF