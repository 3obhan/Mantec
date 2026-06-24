#!/bin/bash
# اسکریپت اجرای منطک روی لینوکس مینت ۳۲ بیت

# مسیر پوشه فعلی اسکریپت
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# رفتن به دایرکتوری اصلی پروژه
cd "$DIR/.."

echo "========================================="
echo "   Mantak (منطک) - Local Server Runner   "
echo "========================================="

# بررسی نصب بودن NodeJS
if ! command -v node &> /dev/null
then
    echo "خطا: NodeJS نصب نیست! لطفاً در ترمینال sudo apt install nodejs را وارد کنید."
    sleep 5
    exit 1
fi

echo "Starting application server (port 3000)..."

# اجرای بک‌اند (از خروجی باندل شده‌ی کلاینت و سرور)
node dist/server.cjs &
SERVER_PID=$!

echo "Server started with PID $SERVER_PID"
echo "Waiting 3 seconds for server to initialize..."
sleep 3

echo "Opening Firefox / Web Browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000"
else
    firefox "http://localhost:3000"
fi

echo "Press [CTRL+C] to stop the server..."
# منتظر ماندن اسکریپت تا زمان بسته شدن توسط کاربر
wait $SERVER_PID
