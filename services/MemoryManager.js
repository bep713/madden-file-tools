const memoryjs = require('memoryjs');

class MemoryManager {
    constructor(processName) {
        this._process = {};
        this._processName = processName;
        this._memoryJs = memoryjs;
    };

    attach(attachSettings) {
        return new Promise((resolve, reject) => {
            const doAttach = () => {
                this._attachToProcess()
                    .then((process) => {
                        resolve(process);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            };

            if (attachSettings) {
                if (attachSettings.delay) {
                    setTimeout(async () => {
                        doAttach();
                    }, attachSettings.delay);
                }
                else if (attachSettings.retry) {
                    const doAttachWithRetry = (currentTry) => {
                        this._attachToProcess()
                            .then((process) => {
                                resolve(process);
                            })
                            .catch((err) => {
                                if (currentTry === attachSettings.retry.maxTries) {
                                    reject(new Error('Process is not available'));
                                }
                                else {
                                    setTimeout(() => {
                                        doAttachWithRetry(currentTry + 1)
                                    }, attachSettings.retry.interval);
                                }
                            })
                    };

                    doAttachWithRetry(1);
                }
            }
            else {
                doAttach();
            }           
        });
    };

    _attachToProcess() {
        return new Promise((resolve, reject) => {
            memoryjs.openProcess(this._processName, (err, processObj) => {
                if (err) {
                    reject(err);
                }
    
                this._process = processObj;    
                resolve(processObj);
            });
        });
    };

    detatch() {
        this._throwIfNotAttached();
        memoryjs.closeProcess(this._process.handle);
        this._process = {};
    };

    isProcessRunning() {
        return new Promise((resolve, reject) => {
            memoryjs.openProcess(this._processName, (err, processObj) => {
                if (err) {
                    return resolve(false);
                }

                return resolve(true);
            });
        });
    };

    findPatternOffset(pattern) {
        this._throwIfNotAttached();

        return new Promise((resolve, reject) => {
            memoryjs.findPattern(this._process.handle, this._processName, pattern, memoryjs.NORMAL, 0, 0, (err, offset) => {
                if (err) {
                    reject(err);
                }

                resolve(offset);
            });
        });
    };

    calculateAbsoluteOffsetFromRelative(relativeOffset) {
        this._throwIfNotAttached();
        return this.process.modBaseAddr + relativeOffset;
    };

    calculateRelativeOffsetFromAbsolute(absoluteOffset) {
        this._throwIfNotAttached();
        return absoluteOffset - this.process.modBaseAddr;
    };

    _throwIfNotAttached() {
        if (!this.process.modBaseAddr) {
            throw new Error('Attach to a process before calling this function.');
        }
    };

    readUInt8(address, options) {
        this._throwIfNotAttached();

        return new Promise((resolve, reject) => {
            if (options && options.addBaseAddressOffset) {
                address = this.calculateAbsoluteOffsetFromRelative(address);
            }

            memoryjs.readMemory(this._process.handle, address, memoryjs.BYTE, (err, value) => {
                if (err) {
                    reject(err);
                }

                resolve(value);
            });
        });
    };

    readUInt16LE(address, options) {
        this._throwIfNotAttached();

        return new Promise((resolve, reject) => {
            if (options && options.addBaseAddressOffset) {
                address = this.calculateAbsoluteOffsetFromRelative(address);
            }

            memoryjs.readMemory(this._process.handle, address, memoryjs.SHORT, (err, value) => {
                if (err) {
                    reject(err);
                }

                resolve(value);
            });
        });
    };

    readUInt32LE(address, options) {
        this._throwIfNotAttached();

        return new Promise((resolve, reject) => {
            if (options && options.addBaseAddressOffset) {
                address = this.calculateAbsoluteOffsetFromRelative(address);
            }

            memoryjs.readMemory(this._process.handle, address, memoryjs.UINT32, (err, value) => {
                if (err) {
                    reject(err);
                }

                resolve(value);
            });
        });
    };

    readBytes(address, length, options) {
        this._throwIfNotAttached();

        return new Promise((resolve, reject) => {
            if (options && options.addBaseAddressOffset) {
                address = this.calculateAbsoluteOffsetFromRelative(address);
            }

            memoryjs.readBuffer(this._process.handle, address, length, (err, value) => {
                if (err) {
                    reject(err);
                }

                resolve(value);
            });
        });
    };

    readBytesAtPattern(pattern, length, patternOffset = 0) {
        this._throwIfNotAttached();

        return new Promise(async (resolve, reject) => {
            try {
                const offset = await this.findPatternOffset(pattern);
                const result = await this.readBytes(offset + patternOffset, length);
                resolve(result);
            }
            catch (err) {
                reject(err);
            }
        });
    };

    setProtection(protection, offset, length, options) {
        this._throwIfNotAttached();

        return new Promise((resolve, reject) => {
            if (options && options.addBaseAddressOffset) {
                offset = this.calculateAbsoluteOffsetFromRelative(offset);
            }

            console.log(protection);

            memoryjs.virtualProtectEx(this.process.handle, offset, length, protection, (err, oldProtection) => {
                if (err) {
                    reject(err);
                }
                
                resolve(oldProtection);
            });
        });
    };

    writeBytes(buf, offset, options) {
        this._throwIfNotAttached();
        memoryjs.writeBuffer(this.process.handle, offset, buf);
    };

    get processName() {
        return this._processName;
    };

    set processName(name) {
        this._processName = name;
    };

    get process() {
        return this._process;
    };
};

MemoryManager.PROTECTION = {
    PAGE_NOACCESS: memoryjs.PAGE_NOACCESS,
    PAGE_READONLY: memoryjs.PAGE_READONLY,
    PAGE_READWRITE: memoryjs.PAGE_READWRITE,
    PAGE_WRITECOPY: memoryjs.PAGE_WRITECOPY,
    PAGE_EXECUTE: memoryjs.PAGE_EXECUTE,
    PAGE_EXECUTE_READ: memoryjs.PAGE_EXECUTE_READ,
    PAGE_EXECUTE_READWRITE: memoryjs.PAGE_EXECUTE_READWRITE,
    PAGE_EXECUTE_WRITECOPY: memoryjs.PAGE_EXECUTE_WRITECOPY,
    PAGE_GUARD: memoryjs.PAGE_GUARD,
    PAGE_NOCACHE: memoryjs.PAGE_NOCACHE,
    PAGE_WRITECOMBINE: memoryjs.PAGE_WRITECOMBINE,
    PAGE_ENCLAVE_UNVALIDATED: memoryjs.PAGE_ENCLAVE_UNVALIDATED,
    PAGE_TARGETS_INVALID: memoryjs.PAGE_TARGETS_INVALID,
    PAGE_TARGETS_NO_UPDATE: memoryjs.PAGE_TARGETS_NO_UPDATE,
    PAGE_ENCLAVE_THREAD_CONTROL: memoryjs.PAGE_ENCLAVE_THREAD_CONTROL
};

module.exports = MemoryManager;