"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
let LocalExceptionFilter = class LocalExceptionFilter {
    catch(exception, response) {
        const status = exception.getStatus();
        const message = exception.getResponse();
        response
            .status(status)
            .json({
            code: status,
            message
        });
    }
};
LocalExceptionFilter = __decorate([
    common_1.Catch(common_1.HttpException)
], LocalExceptionFilter);
exports.LocalExceptionFilter = LocalExceptionFilter;

//# sourceMappingURL=local.exception.filter.js.map
