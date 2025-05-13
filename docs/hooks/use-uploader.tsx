import { useCallback, useRef } from 'react';
import { uniqueId } from 'lodash-es';

const useUploader = () => {
  /** 上传结果观察者 */
  const _uploaderObservers = useRef<
    {
      id: string;
      success: (file: File) => void;
      failure: (err: Error) => void;
      cancel: () => void;
    }[]
  >([]);

  /** 处理图像上传 */
  const AfterFileUpload = useCallback(
    (id: string) => async (e: Event) => {
      const index = _uploaderObservers.current.findIndex((i) => i.id === id);
      if (index === -1) return;

      const observer = _uploaderObservers.current.splice(index, 1)[0];

      const input = e.target as HTMLInputElement;

      /** 文件大小及格式检测 */
      const check = (file: File) => {
        if (!input) return 'message.invalid-file';

        const maxLength = Number(input.getAttribute('maxLength'));
        if (maxLength && file.size > maxLength) return 'message.file-size-exceeds';

        const accepts = input.getAttribute('accept')?.split(',') ?? [];
        if (file.type && accepts.length && !accepts.includes(file.type))
          return 'message.invalid-file';

        return;
      };

      try {
        let file = input?.files?.[0];
        if (!file) {
          return observer.cancel();
        }

        const warn = check(file);
        if (warn) {
          alert(warn);
          return observer.cancel();
        }

        return observer.success(file);
      } catch (err) {
        observer.failure(err as Error);
      } finally {
        // 移除文件占用，防止无法连续上传相同文件
        (input as any).value = null;
      }
    },
    [],
  );

  /** 处理图像取消上传 */
  const AfterFileCancel = useCallback(
    (id: string) => async (e: Event) => {
      const index = _uploaderObservers.current.findIndex((i) => i.id === id);
      if (index === -1) return;

      const observer = _uploaderObservers.current.splice(index, 1)[0];
      observer.cancel();
    },
    [],
  );

  /** 上传文件 */
  const uploadFile = useCallback(async (configs: { accept: string; maxLength: number }) => {
    const id = uniqueId();

    const uploader = document.createElement('input');
    uploader.setAttribute('type', 'file');
    uploader.setAttribute('multiple', 'false');
    uploader.setAttribute('hidden', 'hidden');
    Object.keys(configs).forEach((attr) => {
      uploader.setAttribute(attr, configs[attr]);
    });
    uploader.onchange = AfterFileUpload(id);
    uploader.oncancel = AfterFileCancel(id);
    uploader.click();

    return new Promise<File | null>((resolve, reject) => {
      _uploaderObservers.current?.push({
        id,
        success: (file: File) => {
          resolve(file);
        },
        failure: (err: Error) => {
          reject(err);
        },
        cancel: () => {
          resolve(null);
        },
      });
    });
  }, []);

  return uploadFile;
};

export default useUploader;
