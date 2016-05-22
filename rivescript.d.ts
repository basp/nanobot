declare module 'rivescript' {
    interface SuccessHandler {
        (batch: number): void;
    }

    interface ErrorHandler {
        (err, batch?: number): void;
    }

    interface Subroutine {
        (brain: RiveScript, args: string[]): any;
    }

    class RiveScript {
        say(message: string): void;
        warn(message: string, filename?: string, lineno?: number): void;

        loadFile(path: string, onSuccess: SuccessHandler, onError: ErrorHandler): void;
        loadDirectory(path: string, onSuccess: SuccessHandler, onError: ErrorHandler): void;
        stream(code: string, onError?: (err: string) => void);
        parse(name: string, code: string, onError?: Function): void;
        sortReplies(): void;
        deparse(): any;
        stringify(data?: any): string;
        write(filename: string, data?: any): void;

        setHandler(language: string, object: Object): void;
        setSubroutine(name: string, fn: Subroutine): void;
        setGlobal(name: string, value: string): void;
        setVariable(name: string, value: string): void;
        setSubstitution(name: string, value: string): void;
        setPerson(name: string, value: string): void;
        setUservar(user: string, name: string, value: string): void;
        setUservars(user: string, data: Object): void;
        getVariable(name: string): string;
        getUservar(user: string, name: string): string;
        getUservars(user?: string): any;
        clearUservars(user?: string): void;
        freezeUservars(user: string): void;
        thawUservars(user: string, action?: 'discard' | 'keep' | 'thaw'): void;
        lastMatch(user: string): string;
        currentUser(): string;

        reply(username: string, message: string, scope?: any): string;
        replyAsync(username: string, message: string, scope?: any, callback?: Function): void;
    }

    export = RiveScript;
}