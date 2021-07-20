import { DPMConfiguration } from "../../../../../lib/dist/src/PackageUtil";
import { Parameter, ParameterType } from "../../../util/parameters/Parameter";
import { Repository } from "../../Repository";

export class MySqlRepository implements Repository {
    getDefaultParameterValues(configuration: DPMConfiguration): DPMConfiguration {
        return {
            host: configuration.host || "localhost",
            port: configuration.port || 3306,
            username: configuration.username || "root",
            password: configuration.password || "",
            database: configuration.database || "datapm"
        };
    }

    getConnectionParameters(configuration: DPMConfiguration): Parameter[] | Promise<Parameter[]> {
        const parameters: Parameter[] = [];
        const defaultParameterValues: DPMConfiguration = this.getDefaultParameterValues(configuration);
        if (configuration.host == null) {
            parameters.push({
                configuration,
                type: ParameterType.Text,
                name: "host",
                message: "Hostname or IP?",
                defaultValue: defaultParameterValues.host as string
            });
        }

        if (configuration.port == null) {
            parameters.push({
                configuration,
                type: ParameterType.Number,
                name: "port",
                message: "Port?",
                defaultValue: defaultParameterValues.port as number
            });
        }

        return parameters;
    }

    getAuthenticationParameters(
        connectionConfiguration: DPMConfiguration,
        authenticationConfiguration: DPMConfiguration
    ): Parameter[] | Promise<Parameter[]> {
        const parameters: Parameter[] = [];
        const defaultParameterValues: DPMConfiguration = this.getDefaultParameterValues(authenticationConfiguration);

        if (authenticationConfiguration.username == null) {
            parameters.push({
                configuration: authenticationConfiguration,
                type: ParameterType.Text,
                name: "username",
                message: "Username?",
                defaultValue: defaultParameterValues.username as string
            });
        }

        if (authenticationConfiguration.password == null) {
            parameters.push({
                configuration: authenticationConfiguration,
                type: ParameterType.Password,
                name: "password",
                message: "Password?",
                defaultValue: defaultParameterValues.password as string
            });
        }

        return parameters;
    }

    async testConnection(_connectionConfiguration: DPMConfiguration): Promise<string | true> {
        return true; // TODO implement TCP ping of port
    }

    async testAuthentication(
        _connectionConfiguration: DPMConfiguration,
        _authenticationConfiguration: DPMConfiguration
    ): Promise<string | true> {
        return true;
    }
}
