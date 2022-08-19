import { existsSync, readFileSync } from 'fs';

export class TestCase {
    public static filePath(filename: string): string {
        return `${__dirname}/_files/${filename}`;
    }

    public static fileContents(filename: string): Buffer | string {
        if (!existsSync(TestCase.filePath(filename))) {
            return '';
        }

        return readFileSync(TestCase.filePath(filename));
    }
}
