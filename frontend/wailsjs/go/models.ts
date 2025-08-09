export namespace models {
	
	export class FileNode {
	    id: string;
	    name: string;
	    path: string;
	    size: number;
	    type: string;
	    children?: FileNode[];
	    // Go type: time
	    lastModified: any;
	    isHidden: boolean;
	    permissions?: string;
	
	    static createFrom(source: any = {}) {
	        return new FileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.path = source["path"];
	        this.size = source["size"];
	        this.type = source["type"];
	        this.children = this.convertValues(source["children"], FileNode);
	        this.lastModified = this.convertValues(source["lastModified"], null);
	        this.isHidden = source["isHidden"];
	        this.permissions = source["permissions"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScanResult {
	    root?: FileNode;
	    totalSize: number;
	    totalFiles: number;
	    totalDirectories: number;
	    // Go type: time
	    scanTime: any;
	    scanDuration: number;
	
	    static createFrom(source: any = {}) {
	        return new ScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.root = this.convertValues(source["root"], FileNode);
	        this.totalSize = source["totalSize"];
	        this.totalFiles = source["totalFiles"];
	        this.totalDirectories = source["totalDirectories"];
	        this.scanTime = this.convertValues(source["scanTime"], null);
	        this.scanDuration = source["scanDuration"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

