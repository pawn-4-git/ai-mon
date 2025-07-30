import { validateSession } from "/opt/authHelper.js";

export const lambdaHandler = async (event) => {
    try {
        const authResult = await validateSession(event);
        if (!authResult.isValid) {
            return authResult;
        }

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Request body is missing." }),
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            console.error("JSON parsing error:", e);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON format in request body." }),
            };
        }

        const { correctChoice, questionContext } = body;
        
        if (!correctChoice || !questionContext) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "CorrectChoice and questionContext are required." }),
            };
        }

        const generatedChoices = [
            `Alternative to ${correctChoice} (1)`,
            `Alternative to ${correctChoice} (2)`,
            `Alternative to ${correctChoice} (3)`
        ];

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Incorrect choices generated successfully.",
                incorrectChoices: generatedChoices,
            }),
        };
    } catch (error) {
        console.error("Error generating choices:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
