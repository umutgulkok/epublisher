#!/bin/bash

####################################################################################################
# Guide: https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu-18-04
# Suggested Linux Distribution: Ubuntu 18.04.3 (LTS) x64
# The current user must be 'root'
####################################################################################################

# Always work with root
if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root"
  exit 1
fi
echo "Set a new root password"
passwd

# Extend SSH duration
echo 'ClientAliveInterval 60' >> /etc/ssh/sshd_config
# Allow root SSH temporarily
sed -i 's/PermitRootLogin no/PermitRootLogin yes/g' /etc/ssh/sshd_config
service ssh restart

# Update the OS
apt update
apt upgrade -y
apt install -y sudo

# Create a non-root user
if id "ubuntu" >/dev/null 2>&1; then
  echo "User 'ubuntu' exists, skip"
else
  echo "Adding a new non-root user named 'ubuntu'"
  echo "Set a new password for the new user 'ubuntu'"
  adduser ubuntu
  usermod -aG sudo ubuntu
  cp -r /root/.ssh /home/ubuntu
  chown -R ubuntu:ubuntu /home/ubuntu/.ssh
  chmod -R 700 /home/ubuntu/.ssh/
fi

# Install NodeJS
apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates
curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt install -y nodejs
apt install -y npm

# Install Python
apt install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt install -y python3.7
python3.7 --version
update-alternatives --install /usr/bin/python python /usr/bin/python3.7 1
apt install -y python-pip
apt install -y python3-pip
apt install -y python3.7-dev
apt install -y gettext
pip install uwsgi
pip install gunicorn

# Install Epublisher
apt install -y git
cd /home/ubuntu || exit
rm -rf /home/ubuntu/epublisher
git clone https://github.com/umutgulkok/epublisher.git
echo 'Edit your Django settings file'
vi /home/ubuntu/epublisher/server/epublisher/settings/prod.py
cd /home/ubuntu/epublisher/preprocessor || exit
npm install
cd /home/ubuntu/epublisher/server || exit
pip install -r requirements.txt
python manage.py migrate
echo 'Create epublisher admin user'
python manage.py createsuperuser
python manage.py compilemessages
mkdir /home/ubuntu/epublisher/server/epublisher/static
mkdir /home/ubuntu/epublisher/server/storage
mkdir /home/ubuntu/epublisher/server/log
python manage.py collectstatic --settings=epublisher.settings.prod
chown -R ubuntu:ubuntu /home/ubuntu
# test with 'python manage.py runserver --settings=epublisher.settings.prod 0.0.0.0:80'
# test with 'uwsgi --http :8000 --module epublisher.wsgi'

# Setup Gunicorn
cd /home/ubuntu
rm /etc/systemd/system/gunicorn.socket
touch /etc/systemd/system/gunicorn.socket
echo '[Unit]' | tee -a /etc/systemd/system/gunicorn.socket
echo 'Description=gunicorn socket' | tee -a /etc/systemd/system/gunicorn.socket
echo '' | tee -a /etc/systemd/system/gunicorn.socket
echo '[Socket]' | tee -a /etc/systemd/system/gunicorn.socket
echo 'ListenStream=/run/gunicorn.sock' | tee -a /etc/systemd/system/gunicorn.socket
echo '' | tee -a /etc/systemd/system/gunicorn.socket
echo '[Install]' | tee -a /etc/systemd/system/gunicorn.socket
echo 'WantedBy=sockets.target' | tee -a /etc/systemd/system/gunicorn.socket

rm /etc/systemd/system/gunicorn.service
touch /etc/systemd/system/gunicorn.service
echo '[Unit]' | tee -a /etc/systemd/system/gunicorn.service
echo 'Description=gunicorn daemon' | tee -a /etc/systemd/system/gunicorn.service
echo 'Requires=gunicorn.socket' | tee -a /etc/systemd/system/gunicorn.service
echo 'After=network.target' | tee -a /etc/systemd/system/gunicorn.service
echo '' | tee -a /etc/systemd/system/gunicorn.service
echo '[Service]' | tee -a /etc/systemd/system/gunicorn.service
echo 'User=ubuntu' | tee -a /etc/systemd/system/gunicorn.service
echo 'Group=www-data' | tee -a /etc/systemd/system/gunicorn.service
echo 'WorkingDirectory=/home/ubuntu/epublisher/server/' | tee -a /etc/systemd/system/gunicorn.service
echo 'ExecStart=/usr/local/bin/gunicorn --error-logfile /home/ubuntu/epublisher/server/log/error.log --access-logfile /home/ubuntu/epublisher/server/log/access.log --workers 3 --bind unix:/run/gunicorn.sock epublisher.wsgi:application' | tee -a /etc/systemd/system/gunicorn.service
echo '' | tee -a /etc/systemd/system/gunicorn.service
echo '[Install]' | tee -a /etc/systemd/system/gunicorn.service
echo 'WantedBy=multi-user.target' | tee -a /etc/systemd/system/gunicorn.service

systemctl reload gunicorn.service
systemctl start gunicorn.service
systemctl enable gunicorn.service

systemctl reload gunicorn.socket
systemctl start gunicorn.socket
systemctl enable gunicorn.socket

# Test Gunicorn
# systemctl status gunicorn.service
# journalctl -u gunicorn.service
# systemctl status gunicorn.socket
# file /run/gunicorn.sock
# journalctl -u gunicorn.socket
# You should see some html with this:
#    curl --unix-socket /run/gunicorn.sock localhost
# Now the service has been activated, you should see the workers:
#    systemctl status gunicorn

# Setup NGINX
cd /home/ubuntu
apt install -y nginx
rm /etc/nginx/sites-available/epublisher_nginx.conf
touch /etc/nginx/sites-available/epublisher_nginx.conf
echo 'server {' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    listen      80;' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
read -p 'Enter your host name: '
echo "    server_name $REPLY;" | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    charset     utf-8;' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    client_max_body_size 75M;' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    location /static {' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '        alias /home/ubuntu/static;' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    }' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    location / {' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '        include proxy_params;' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '        proxy_pass http://unix:/run/gunicorn.sock;' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    }' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '}' | tee -a /etc/nginx/sites-available/epublisher_nginx.conf
ln -s /etc/nginx/sites-available/epublisher_nginx.conf /etc/nginx/sites-enabled
nginx -t
systemctl restart nginx

# Setup Firewall
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow https
ufw allow http
ufw --force enable

# Setup SSL Certificate
# https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-18-04
add-apt-repository -y ppa:certbot/certbot
apt install -y python-certbot-nginx
read -p 'Enter your host name: '
certbot --nginx -d $REPLY

# Disallow root SSH
sed -i 's/PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config
sed -i 's/AllowUsers ubuntu//g' /etc/ssh/sshd_config
echo 'AllowUsers ubuntu' >> /etc/ssh/sshd_config
echo "WARNING: SSH with root will be disabled. Use 'ssh ubuntu@<YOUR_DOMAIN_NAME_OR_IP>' from now on."

reboot
