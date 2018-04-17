import { OnModuleInit } from "@nestjs/common";
import { FileUtil } from "./util/file.util";
export declare class LocalModule implements OnModuleInit {
    private readonly fileUtil;
    constructor(fileUtil: FileUtil);
    onModuleInit(): Promise<void>;
}
