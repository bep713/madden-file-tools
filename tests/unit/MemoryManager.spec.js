const sinon = require('sinon');
const { expect } = require('chai');
const memoryjs = require('memoryjs');
const MemoryManager = require('../../services/MemoryManager');

const TEST_PROCESS_NAME = 'Code.exe';
let manager = new MemoryManager(TEST_PROCESS_NAME);

describe('memory manager unit tests', () => {
    beforeEach(() => {
        manager = new MemoryManager(TEST_PROCESS_NAME);
    });

    describe('has a method to attach to a process', () => {
        it('method exists', () => {
            expect(manager.attach).to.exist;
        });

        it('method sets the process instance variable', async () => {
            await manager.attach();
            expect(manager.process.szExeFile).to.eql(TEST_PROCESS_NAME);
        });

        describe('allows delayed process attachment', async () => {
            it('can delay attaching to a process', async () => {
                const delayTime = 1000;
                const startTime = Date.now();
                
                await manager.attach({
                    delay: delayTime
                });

                const endTime = Date.now();

                expect(endTime - startTime).to.be.greaterThan(delayTime);
            });

            it('can specify how many times to retry attachment and at what interval', async () => {
                const numTries = 10;
                const interval = 100;
                
                const openProcessSpy = sinon.spy(memoryjs, 'openProcess');
                manager.processName = 'DNE.exe';
                
                const startTime = Date.now();

                try {
                    await manager.attach({
                        retry: {
                            interval: interval,
                            maxTries: numTries
                        }
                    });
                }
                catch (err) {

                }

                const endTime = Date.now();
                openProcessSpy.restore();

                expect(openProcessSpy.callCount).to.equal(numTries);
                expect(endTime - startTime).to.be.greaterThan((numTries * interval) - interval);    // First call is instant, so we have to subtract 1
            });
        });
    });

    describe('has a method to detatch from a process', () => {
        it('method exists', () => {
            expect(manager.detatch).to.exist;
        });

        it('method sets the process instance variable to null', () => {
            manager.attach();
            manager.detatch();
            expect(manager.process).to.eql({});
        });
    });

    describe('has a method to check if a process is currently running', () => {
        it('method exists', () => {
            expect(manager.isProcessRunning).to.exist;
        });

        it('returns expected result', async () => {
            const result = await manager.isProcessRunning();
            expect(result).to.equal(true);
        });

        it('returns expected result when process is not running', async () => {
            let dneProcess = new MemoryManager('DNE.exe');
            const result = await dneProcess.isProcessRunning();
            expect(result).to.equal(false);
        });
    });

    describe('has a method to find the address of a pattern', () => {
        it('method exists', () => {
            expect(manager.findPatternOffset).to.exist;
        });

        it('returns expected result', async () => {
            await manager.attach();
            let address = await manager.findPatternOffset('01');

            expect(address).to.equal(0x7FF7EA130004);
        });

        // it('can enter a pattern offset to find the next match', async () => {
        //     await manager.attach();
        //     let address = await manager.findPatternOffset('01', 1);

        //     expect(address).to.equal(0x7FF7EA13004A);
        // });

        // it('can enter an address offset to find the next match after the address', async () => {
        //     await manager.attach();
        //     let address = await manager.findPatternOffset('00', 0, 140702760763397);

        //     expect(address).to.equal(140706687877128);
        // });
    });

    describe('has a method to read bytes at an offset', () => {
        beforeEach(async () => {
            await manager.attach();
        });

        it('uint8', async () => {
            const result = await manager.readUInt8(0x7FF7EA130003);
            expect(result).to.equal(0);
        });

        it('can specify to start offset at module base address', async () => {
            const result = await manager.readUInt8(3, {
                addBaseAddressOffset: true
            });

            expect(result).to.equal(0);
        });

        it('uint16 LE', async () => {
            const result = await manager.readUInt16LE(0x7FF7EA130003);
            expect(result).to.equal(256);
        });

        it('can specify to start offset at module base address - uint16 LE', async () => {
            const result = await manager.readUInt16LE(3, {
                addBaseAddressOffset: true
            });

            expect(result).to.equal(256);
        });

        it('uint32 LE', async () => {
            const result = await manager.readUInt32LE(0x7FF7EA130003);
            expect(result).to.equal(256);
        });

        it('can specify to start offset at module base address - uint32 LE', async () => {
            const result = await manager.readUInt32LE(3, {
                addBaseAddressOffset: true
            });

            expect(result).to.equal(256);
        });

        it('read bytes', async () => {
            const result = await manager.readBytes(0x7FF7EA130003, 4);
            expect(result.length).to.equal(4);
            expect(result).to.eql(Buffer.from([0x00, 0x01, 0x00, 0x00]));
        });

        it('can specify to start offset at module base address - read bytes', async () => {
            const result = await manager.readBytes(3, 4, {
                addBaseAddressOffset: true
            });

            expect(result.length).to.equal(4);
            expect(result).to.eql(Buffer.from([0x00, 0x01, 0x00, 0x00]));
        });
    });

    describe('has a method to read bytes at a specific pattern', () => {
        beforeEach(async () => {
            await manager.attach();
        });

        it('returns expected result', async () => {
            const result = await manager.readBytesAtPattern('54 68 69 73', 10);
            expect(result).to.eql(Buffer.from([0x54, 0x68, 0x69, 0x73, 0x20, 0x70, 0x72, 0x6F, 0x67, 0x72]));
        });

        it('has ability to add an offset after the pattern address', async () => {
            const result = await manager.readBytesAtPattern('54 68 69 73', 10, 1);
            expect(result).to.eql(Buffer.from([0x68, 0x69, 0x73, 0x20, 0x70, 0x72, 0x6F, 0x67, 0x72, 0x61]));
        });
    });

    describe('has a method to calculate an absolute offset from a relative offset', () => {
        it('returns expected result', async () => {
            await manager.attach();
            const result = manager.calculateAbsoluteOffsetFromRelative(1);
            expect(result).to.eql(manager.process.modBaseAddr + 1);
        });

        it('throws error if not attached yet', () => {
            let errorFn = () => {
                manager.calculateAbsoluteOffsetFromRelative(0);
            };

            expect(errorFn).to.throw(Error);
        });
    });

    describe('has a method to calculate a relative offset from an absolute offset', () => {
        it('returns expected result', async () => {
            await manager.attach();
            const result = manager.calculateRelativeOffsetFromAbsolute(manager.process.modBaseAddr + 1);
            expect(result).to.eql(1);
        });

        it('throws error if not attached yet', () => {
            let errorFn = () => {
                manager.calculateRelativeOffsetFromAbsolute(0);
            };

            expect(errorFn).to.throw(Error);
        });
    });

    // describe('has a method to change memory protection', () => {
    //     it('method exists', async () => {
    //         await manager.attach();
    //         await manager.setProtection(MemoryManager.PROTECTION.PAGE_READWRITE, 0, 4, {
    //             addBaseAddressOffset: true
    //         });
    //     });
    // });

    describe('has a method to write bytes', () => {
        let writeStub;

        before(() => {
            writeStub = sinon.stub(memoryjs, 'writeBuffer');
        });

        after(() => {
            writeStub.restore();
        });

        it('write bytes', async () => {
            await manager.attach();

            const buf = Buffer.from([0x01, 0x00, 0x00, 0x00]);
            await manager.writeBytes(buf, 0x7FF7EA130003);
        });
    });
});