import {
  AbortMultipartUploadCommand,
  ChecksumAlgorithm,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { InternalServerErrorException } from '@nestjs/common';

import { UploaderService } from './uploader.service';

describe(UploaderService.name, () => {
  const filename = 'file.txt';
  const objectKey = 'path/file.txt';
  const bucketName = 'bucket';
  const correlationIdService = {
    correlationId: '5903cba5-7066-4ff4-a619-4b5c84d77dff',
  } as any;
  const logger = { verbose: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use a single PUT upload (no multipart) WITHOUT checksum', async () => {
    const s3 = {
      send: vi.fn().mockResolvedValueOnce({}),
    } as any;
    const uut = new UploaderService(
      s3,
      filename,
      objectKey,
      bucketName,
      logger,
      correlationIdService,
      undefined, // checksumAlgorithm not set
    );

    const data = new Uint8Array([1, 2, 3]);

    await uut.upload(
      data,
      true /* isLastChunk */,
      undefined /* checksum */,
    );

    expect(s3.send).toHaveBeenCalledTimes(1);
    const cmd = vi.mocked(s3.send).mock.calls[0][0];
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    const input = getCommandInput<PutObjectCommand>(cmd);
    expect(input).toEqual(
      expect.objectContaining({
        Bucket: bucketName,
        Key: objectKey,
        Body: data,
      }),
    );
    // Ensure checksum-related fields are absent
    expect(input).not.toHaveProperty('ChecksumAlgorithm');
    expect(input).not.toHaveProperty('ChecksumCRC32');
    expect(input).not.toHaveProperty('ChecksumSHA256');
  });

  it('should use a single PUT upload (no multipart) WITH checksum + algorithm', async () => {
    const s3 = {
      send: vi.fn().mockResolvedValueOnce({}),
    } as any;
    const checksumAlgorithm = ChecksumAlgorithm.CRC32;
    const checksum = 'i9aeUg==';
    const uut = new UploaderService(
      s3,
      filename,
      objectKey,
      bucketName,
      logger,
      correlationIdService,
      checksumAlgorithm,
    );
    const data = new Uint8Array([9, 9, 9]);

    await uut.upload(data, true, checksum);

    expect(s3.send).toHaveBeenCalledTimes(1);
    const cmd = vi.mocked(s3.send).mock.calls[0][0];
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    const input = getCommandInput<PutObjectCommand>(cmd);
    expect(input).toEqual(
      expect.objectContaining({
        Bucket: bucketName,
        Key: objectKey,
        Body: data,
        ChecksumAlgorithm: checksumAlgorithm,
        // dynamic property name: "Checksum" + algorithm (e.g. ChecksumCRC32)
        ChecksumCRC32: checksum,
      }),
    );
  });

  it.todo(
    'should use multipart upload WITHOUT checksum (create -> uploadPart -> uploadPart -> complete without checksum fields)',
  );

  it.todo(
    'should use multipart upload WITH checksum (create includes checksum config; complete includes full-object checksum)',
  );

  it('should do nothing if not multipart', async () => {
    const s3 = {
      send: vi.fn(),
    } as any;
    const uut = new UploaderService(
      s3,
      filename,
      objectKey,
      bucketName,
      logger,
      correlationIdService,
    );

    await uut.abortUpload();

    expect(s3.send).not.toHaveBeenCalled();
  });

  it('should send AbortMultipartUploadCommand when multipart started', async () => {
    const s3 = {
      send: vi
        .fn()
        .mockResolvedValueOnce({ UploadId: 'u-3' }) // create
        .mockResolvedValueOnce({ ETag: '"etag-1"' }), // uploadPart
    } as any;
    const uut = new UploaderService(
      s3,
      filename,
      objectKey,
      bucketName,
      logger,
      correlationIdService,
    );
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    await uut.upload(big, false); // not last, but big enough => create + uploadPart
    (s3.send as any).mockResolvedValueOnce({}); // abort response

    await uut.abortUpload();

    const abortCmd = vi.mocked(s3.send).mock.calls.at(-1)![0];
    expect(abortCmd).toBeInstanceOf(AbortMultipartUploadCommand);
    expect(
      getCommandInput<AbortMultipartUploadCommand>(abortCmd),
    ).toEqual(
      expect.objectContaining({
        Bucket: bucketName,
        Key: objectKey,
        UploadId: 'u-3',
      }),
    );
  });

  it('should throw if createMultipartUpload returns missing UploadId', async () => {
    const s3 = {
      send: vi.fn().mockResolvedValueOnce({}),
    } as any;
    const uut = new UploaderService(
      s3,
      filename,
      objectKey,
      bucketName,
      logger,
      correlationIdService,
    );
    const big = new Uint8Array(5 * 1024 * 1024 + 1);

    await expect(uut.upload(big, false)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});

function getCommandInput<T extends { input: any }>(
  cmd: any,
): T['input'] {
  return cmd.input;
}
