export namespace domain {
	
	export class AddressRule {
	    addressType: string;
	    dbNumber: number;
	    byteStart: number;
	    bitStart: number;
	    step: number;
	
	    static createFrom(source: any = {}) {
	        return new AddressRule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.addressType = source["addressType"];
	        this.dbNumber = source["dbNumber"];
	        this.byteStart = source["byteStart"];
	        this.bitStart = source["bitStart"];
	        this.step = source["step"];
	    }
	}
	export class OperationScope {
	    type: string;
	    selectedRowIds: string[];
	    filterCondition: string;
	
	    static createFrom(source: any = {}) {
	        return new OperationScope(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.selectedRowIds = source["selectedRowIds"];
	        this.filterCondition = source["filterCondition"];
	    }
	}
	export class ColumnOperation {
	    csvFileId: string;
	    columnName: string;
	    operationType: string;
	    scope: OperationScope;
	    value: string;
	    findText: string;
	    replaceText: string;
	    prefix: string;
	    suffix: string;
	    numberStart: number;
	    numberStep: number;
	    numberWidth: number;
	    template: string;
	    addressRule?: AddressRule;
	
	    static createFrom(source: any = {}) {
	        return new ColumnOperation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.csvFileId = source["csvFileId"];
	        this.columnName = source["columnName"];
	        this.operationType = source["operationType"];
	        this.scope = this.convertValues(source["scope"], OperationScope);
	        this.value = source["value"];
	        this.findText = source["findText"];
	        this.replaceText = source["replaceText"];
	        this.prefix = source["prefix"];
	        this.suffix = source["suffix"];
	        this.numberStart = source["numberStart"];
	        this.numberStep = source["numberStep"];
	        this.numberWidth = source["numberWidth"];
	        this.template = source["template"];
	        this.addressRule = this.convertValues(source["addressRule"], AddressRule);
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
	export class CsvFileNode {
	    id: string;
	    projectId: string;
	    folderId: string;
	    name: string;
	    toolType: string;
	    originalPath: string;
	    internalPath: string;
	    encoding: string;
	    lineEnding: string;
	    columnCount: number;
	    rowCount: number;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new CsvFileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.folderId = source["folderId"];
	        this.name = source["name"];
	        this.toolType = source["toolType"];
	        this.originalPath = source["originalPath"];
	        this.internalPath = source["internalPath"];
	        this.encoding = source["encoding"];
	        this.lineEnding = source["lineEnding"];
	        this.columnCount = source["columnCount"];
	        this.rowCount = source["rowCount"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class DirtySummary {
	    projectId: string;
	    hasDirtyChanges: boolean;
	    changeTypeCounts: Record<string, number>;
	    lastRestorePointAt: string;
	
	    static createFrom(source: any = {}) {
	        return new DirtySummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectId = source["projectId"];
	        this.hasDirtyChanges = source["hasDirtyChanges"];
	        this.changeTypeCounts = source["changeTypeCounts"];
	        this.lastRestorePointAt = source["lastRestorePointAt"];
	    }
	}
	export class FolderNode {
	    id: string;
	    projectId: string;
	    parentId: string;
	    name: string;
	    pathCache: string;
	    depth: number;
	    folders: FolderNode[];
	    files: CsvFileNode[];
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new FolderNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.parentId = source["parentId"];
	        this.name = source["name"];
	        this.pathCache = source["pathCache"];
	        this.depth = source["depth"];
	        this.folders = this.convertValues(source["folders"], FolderNode);
	        this.files = this.convertValues(source["files"], CsvFileNode);
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
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
	export class KioCsvHeader {
	    id: string;
	    csvFileId: string;
	    columnIndex: number;
	    columnName: string;
	
	    static createFrom(source: any = {}) {
	        return new KioCsvHeader(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.csvFileId = source["csvFileId"];
	        this.columnIndex = source["columnIndex"];
	        this.columnName = source["columnName"];
	    }
	}
	export class KioExportFileRequest {
	    relativePath: string;
	    downloadName: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new KioExportFileRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.relativePath = source["relativePath"];
	        this.downloadName = source["downloadName"];
	        this.content = source["content"];
	    }
	}
	export class KioExportFileResult {
	    relativePath: string;
	    filePath: string;
	    rowCount: number;
	
	    static createFrom(source: any = {}) {
	        return new KioExportFileResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.relativePath = source["relativePath"];
	        this.filePath = source["filePath"];
	        this.rowCount = source["rowCount"];
	    }
	}
	export class KioFieldMetadata {
	    columnName: string;
	    displayName: string;
	    fieldGroup: string;
	    isCommon: boolean;
	    description: string;
	    example: string;
	    editorType: string;
	    sortOrder: number;
	
	    static createFrom(source: any = {}) {
	        return new KioFieldMetadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.columnName = source["columnName"];
	        this.displayName = source["displayName"];
	        this.fieldGroup = source["fieldGroup"];
	        this.isCommon = source["isCommon"];
	        this.description = source["description"];
	        this.example = source["example"];
	        this.editorType = source["editorType"];
	        this.sortOrder = source["sortOrder"];
	    }
	}
	export class KioFieldValue {
	    id: string;
	    variableId: string;
	    columnIndex: number;
	    columnName: string;
	    columnValue: string;
	    isVisible: boolean;
	    fieldGroup: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new KioFieldValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.variableId = source["variableId"];
	        this.columnIndex = source["columnIndex"];
	        this.columnName = source["columnName"];
	        this.columnValue = source["columnValue"];
	        this.isVisible = source["isVisible"];
	        this.fieldGroup = source["fieldGroup"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class KioVariable {
	    id: string;
	    projectId: string;
	    folderId: string;
	    csvFileId: string;
	    rowIndex: number;
	    tagId: string;
	    tagName: string;
	    description: string;
	    channelName: string;
	    deviceName: string;
	    tagGroup: string;
	    itemName: string;
	    itemDataType: string;
	    itemAccessMode: string;
	    enable: string;
	    collectInterval: string;
	    hisRecordMode: string;
	    hisInterval: string;
	    fields: Record<string, string>;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new KioVariable(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.folderId = source["folderId"];
	        this.csvFileId = source["csvFileId"];
	        this.rowIndex = source["rowIndex"];
	        this.tagId = source["tagId"];
	        this.tagName = source["tagName"];
	        this.description = source["description"];
	        this.channelName = source["channelName"];
	        this.deviceName = source["deviceName"];
	        this.tagGroup = source["tagGroup"];
	        this.itemName = source["itemName"];
	        this.itemDataType = source["itemDataType"];
	        this.itemAccessMode = source["itemAccessMode"];
	        this.enable = source["enable"];
	        this.collectInterval = source["collectInterval"];
	        this.hisRecordMode = source["hisRecordMode"];
	        this.hisInterval = source["hisInterval"];
	        this.fields = source["fields"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class KioProject {
	    csvFile: CsvFileNode;
	    headers: KioCsvHeader[];
	    variables: KioVariable[];
	    fields: KioFieldValue[];
	    metadata: KioFieldMetadata[];
	
	    static createFrom(source: any = {}) {
	        return new KioProject(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.csvFile = this.convertValues(source["csvFile"], CsvFileNode);
	        this.headers = this.convertValues(source["headers"], KioCsvHeader);
	        this.variables = this.convertValues(source["variables"], KioVariable);
	        this.fields = this.convertValues(source["fields"], KioFieldValue);
	        this.metadata = this.convertValues(source["metadata"], KioFieldMetadata);
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
	
	export class PreviewSample {
	    rowId: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new PreviewSample(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rowId = source["rowId"];
	        this.value = source["value"];
	    }
	}
	export class OperationPreview {
	    affectedCount: number;
	    columnName: string;
	    operationType: string;
	    before: PreviewSample[];
	    after: PreviewSample[];
	
	    static createFrom(source: any = {}) {
	        return new OperationPreview(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.affectedCount = source["affectedCount"];
	        this.columnName = source["columnName"];
	        this.operationType = source["operationType"];
	        this.before = this.convertValues(source["before"], PreviewSample);
	        this.after = this.convertValues(source["after"], PreviewSample);
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
	export class OperationResult {
	    affectedCount: number;
	    changeLogId: string;
	
	    static createFrom(source: any = {}) {
	        return new OperationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.affectedCount = source["affectedCount"];
	        this.changeLogId = source["changeLogId"];
	    }
	}
	
	
	export class ProjectNode {
	    id: string;
	    name: string;
	    description: string;
	    folders: FolderNode[];
	    files: CsvFileNode[];
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ProjectNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.folders = this.convertValues(source["folders"], FolderNode);
	        this.files = this.convertValues(source["files"], CsvFileNode);
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
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
	export class RestorePoint {
	    id: string;
	    projectId: string;
	    name: string;
	    description: string;
	    snapshotPath: string;
	    csvCount: number;
	    variableCount: number;
	    folderCount: number;
	    changeCount: number;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new RestorePoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.snapshotPath = source["snapshotPath"];
	        this.csvCount = source["csvCount"];
	        this.variableCount = source["variableCount"];
	        this.folderCount = source["folderCount"];
	        this.changeCount = source["changeCount"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class WorkspaceTree {
	    projects: ProjectNode[];
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceTree(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projects = this.convertValues(source["projects"], ProjectNode);
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

