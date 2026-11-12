import os
import sys
import subprocess
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    # Determine Python executable
    if sys.platform == "win32":
        venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
        npm_cmd = "npm.cmd"
    else:
        venv_python = os.path.join(backend_dir, "venv", "bin", "python")
        npm_cmd = "npm"

    python_bin = venv_python if os.path.exists(venv_python) else sys.executable

    print("\n------------------------------------------------------------")
    print("  PaisaWise - Starting Backend & Frontend Concurrently")
    print("  Backend API:  http://127.0.0.1:8000 (Docs: /docs)")
    print("  Frontend UI:  http://localhost:3000")
    print("  Press Ctrl+C to terminate both servers.")
    print("------------------------------------------------------------\n")

    # Start Backend
    backend_process = subprocess.Popen(
        [python_bin, "-m", "uvicorn", "app.main:app", "--port", "8000", "--host", "127.0.0.1", "--reload"],
        cwd=backend_dir
    )

    # Start Frontend
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    def shutdown(signum, frame):
        print("\nShutting down PaisaWise servers...")
        backend_process.terminate()
        frontend_process.terminate()
        try:
            backend_process.wait(timeout=3)
            frontend_process.wait(timeout=3)
        except Exception:
            backend_process.kill()
            frontend_process.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Wait for either process to exit
    try:
        while True:
            b_exit = backend_process.poll()
            f_exit = frontend_process.poll()
            if b_exit is not None or f_exit is not None:
                break
    except KeyboardInterrupt:
        shutdown(None, None)

    shutdown(None, None)

if __name__ == "__main__":
    main()

