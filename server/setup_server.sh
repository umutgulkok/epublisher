####################################################################################################
# Guide: https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu-18-04
# Suggested Linux Distribution: Ubuntu 18.04.3 (LTS) x64
# Assumes that the current user is 'root'
####################################################################################################

apt update
apt install -y git

echo "Set a new root password"
passwd
apt-get install -y sudo
sed -i 's/PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config
echo 'AllowUsers ubuntu' >> /etc/ssh/sshd_config
echo 'ClientAliveInterval 60' >> /etc/ssh/sshd_config
echo "Adding new non-root user named 'ubuntu'"
adduser ubuntu
usermod -a -G sudo ubuntu
cp -r /root/.ssh /home/ubuntu
chown -R ubuntu:ubuntu /home/ubuntu/.ssh
chmod -R 700 /home/ubuntu/.ssh/

# Install NodeJS
sudo apt install -y nodejs

# Install Python
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt install -y python3.7
python3.7 --version
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.7 1
sudo apt install -y python3-venv
sudo apt install -y python3.7-venv
sudo apt install -y python3-pip
sudo apt install -y python3.7-dev
sudo apt install -y gettext
python3.7 -m venv django-venv
source /home/ubuntu/django-venv/bin/activate
pip install uwsgi
pip install gunicorn

# Install Epublisher
cd /home/ubuntu
git clone https://github.com/umutgulkok/epublisher.git
echo 'Edit your Django settings file'
vi /home/ubuntu/epublisher/server/epublisher/settings/prod.py
cd /home/ubuntu/epublisher/server || exit
pip install -r requirements.txt
python manage.py migrate
echo 'Create epublisher admin user'
python manage.py createsuperuser
python manage.py compilemessages
python manage.py collectstatic --settings=epublisher.settings.prod
# test with 'python manage.py runserver --settings=epublisher.settings.prod 0.0.0.0:80'
# test with 'uwsgi --http :8000 --module epublisher.wsgi'
deactivate

# Setup Gunicorn
cd /home/ubuntu
sudo rm /etc/systemd/system/gunicorn.socket
sudo touch /etc/systemd/system/gunicorn.socket
echo '[Unit]' | sudo tee -a /etc/systemd/system/gunicorn.socket
echo 'Description=gunicorn socket' | sudo tee -a /etc/systemd/system/gunicorn.socket
echo '' | sudo tee -a /etc/systemd/system/gunicorn.socket
echo '[Socket]' | sudo tee -a /etc/systemd/system/gunicorn.socket
echo 'ListenStream=/run/gunicorn.sock' | sudo tee -a /etc/systemd/system/gunicorn.socket
echo '' | sudo tee -a /etc/systemd/system/gunicorn.socket
echo '[Install]' | sudo tee -a /etc/systemd/system/gunicorn.socket
echo 'WantedBy=sockets.target' | sudo tee -a /etc/systemd/system/gunicorn.socket

sudo rm /etc/systemd/system/gunicorn.service
sudo touch /etc/systemd/system/gunicorn.service
echo '[Unit]' | sudo tee -a /etc/systemd/system/gunicorn.service
echo 'Description=gunicorn daemon' | sudo tee -a /etc/systemd/system/gunicorn.service
echo 'Requires=gunicorn.socket' | sudo tee -a /etc/systemd/system/gunicorn.service
echo 'After=network.target' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '[Service]' | sudo tee -a /etc/systemd/system/gunicorn.service
echo 'User=ubuntu' | sudo tee -a /etc/systemd/system/gunicorn.service
echo 'Group=www-data' | sudo tee -a /etc/systemd/system/gunicorn.service
echo 'WorkingDirectory=/home/ubuntu/epublisher/server/' | sudo tee -a /etc/systemd/system/gunicorn.service
echo 'ExecStart=/home/ubuntu/django-venv/bin/gunicorn \ ' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '          --error-logfile - \ ' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '          --access-logfile - \ ' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '          --workers 3 \ ' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '          --bind unix:/run/gunicorn.sock \ ' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '          epublisher.wsgi:application' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '' | sudo tee -a /etc/systemd/system/gunicorn.service
echo '[Install]' | sudo tee -a /etc/systemd/system/gunicorn.service
echo 'WantedBy=multi-user.target' | sudo tee -a /etc/systemd/system/gunicorn.service

sudo systemctl reload gunicorn.service
sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket

# Test Gunicorn
sudo systemctl status gunicorn.socket
file /run/gunicorn.sock
sudo journalctl -u gunicorn.socket
# You should see some html with this:
#    curl --unix-socket /run/gunicorn.sock localhost
# Now the service has been activated, you should see the workers:
#    sudo systemctl status gunicorn

# Setup NGINX
cd /home/ubuntu
sudo apt-get install -y nginx
sudo rm /etc/nginx/sites-available/epublisher_nginx.conf
sudo touch /etc/nginx/sites-available/epublisher_nginx.conf
echo 'server {' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    listen      80;' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
read -p 'Enter your host name: '
echo "    server_name $REPLY;" | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    charset     utf-8;' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    client_max_body_size 75M;' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    location /static {' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '        alias /home/ubuntu/static;' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    }' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    location / {' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '        include proxy_params;' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '        proxy_pass http://unix:/run/gunicorn.sock;' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '    }' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
echo '}' | sudo tee -a /etc/nginx/sites-available/epublisher_nginx.conf
sudo ln -s /etc/nginx/sites-available/epublisher_nginx.conf /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx

# Setup Firewall
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow https
sudo ufw allow http
sudo ufw --force enable

# Setup SSL Certificate
# https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-18-04
sudo add-apt-repository -y ppa:certbot/certbot
sudo apt install -y python-certbot-nginx
read -p 'Enter your host name: '
sudo certbot --nginx -d $REPLY
