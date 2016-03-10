# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/wily64"
  config.vm.provision "shell", inline: <<-SHELL
     sudo apt-get update
     sudo apt-get install -y icnsutils clang
     sudo gem install fpm
     git clone https://github.com/creationix/nvm.git ~/.nvm
     source ~/.nvm/nvm.sh
     nvm install 5
  SHELL
end
