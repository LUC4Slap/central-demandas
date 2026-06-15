#Sahil-itsMalvious

import socket
from IPy import IP
import threading

def scan_port(ipaddress, port):
    try:
        sock = socket.socket()
        sock.settimeout(1)
        sock.connect((ipaddress, port))
        print(f"[+] Port {port} is open")
        sock.close()
    except:
        pass

def check_ip(ip):
    try:
        IP(ip)
        return ip
    except ValueError:
        return socket.gethostbyname(ip)

def scan(target, start_port, end_port):
    converted_ip = check_ip(target)
    print(f"\n[#] Scanning Target: {converted_ip} from port {start_port} to {end_port}")
    for port in range(start_port, end_port + 1):
        thread = threading.Thread(target=scan_port, args=(converted_ip, port))
        thread.start()

targets = input("[+] Enter target/s to scan (separate multiple targets with commas): ")
port_range = input("[+] Enter the port range to scan (e.g. 20-80): ")

if '-' in port_range:
    start_port, end_port = map(int, port_range.split('-'))
else:
    start_port, end_port = 1, 65535

if ',' in targets:
    for target in targets.split(','):
        scan(target.strip(), start_port, end_port)
else:
    scan(targets, start_port, end_port)