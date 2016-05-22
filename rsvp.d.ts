declare module RSVP {
    export class Promise<T> {
        constructor(fn: (resolve: (value: T) => void, reject: (error: any) => void) => void);
        then(fn: Function): Promise<T>;
        catch(fn: Function): Promise<T>;
        finally(fn: Function): Promise<T>;
    }

    function on(event: string, listener: Function): void;
    function all<T>(promises: Promise<T>[]): Promise<T>;
    function hash(promises: Object): Promise<Object>;
}

declare module 'rsvp' {
    export = RSVP;
}