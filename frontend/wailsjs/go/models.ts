export namespace models {
	
	export class DeleteOperation {
	    id: string;
	    deleted_paths: string[];
	    timestamp: string;
	
	    static createFrom(source: any = {}) {
	        return new DeleteOperation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.deleted_paths = source["deleted_paths"];
	        this.timestamp = source["timestamp"];
	    }
	}
	export class FileInfo {
	    path: string;
	    size: number;
	    name: string;
	    extension: string;
	    modified: number;
	    partial_hash: string;
	    full_hash: string;
	    perceptual_hash: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.size = source["size"];
	        this.name = source["name"];
	        this.extension = source["extension"];
	        this.modified = source["modified"];
	        this.partial_hash = source["partial_hash"];
	        this.full_hash = source["full_hash"];
	        this.perceptual_hash = source["perceptual_hash"];
	    }
	}
	export class DuplicateGroup {
	    id: string;
	    kind: string;
	    similarity: number;
	    files: FileInfo[];
	    total_size: number;
	    wasted_size: number;
	
	    static createFrom(source: any = {}) {
	        return new DuplicateGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.kind = source["kind"];
	        this.similarity = source["similarity"];
	        this.files = this.convertValues(source["files"], FileInfo);
	        this.total_size = source["total_size"];
	        this.wasted_size = source["wasted_size"];
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

