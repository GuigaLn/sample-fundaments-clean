// core/application
class IError extends Error  {
    readonly statusCode: number;

    constructor(statusCode: number, message?: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

class BadRequest extends IError {
    constructor(message?: string) {
        super(400, message);
    }
}

class ConflictException extends IError {
    constructor(message?: string) {
        super(409, message);
    }
}

abstract class IUseCase<inputs, output> {
    abstract execute(inputs: inputs): Promise<output>
}

interface IRequest {
    body: Record<string, any>;
}

interface IResponse {
    body: Record<string, any> | null;
    statusCode: number;
}

abstract class IController {
    abstract handle(request: IRequest): IResponse
}

// domain/entities/User.ts
interface IUser {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: string;
}

// domain/entities/UserCreate.ts
interface IUserCreate {
    id: string;
    name: string;
    email: string;
    password: string;
}

class User {
    readonly props: IUserCreate;

    constructor(props: IUserCreate) {
        this.props = props;
        this.validate();
    }

    private validate() {
        if(!this.props?.id) {
            throw new BadRequest('Id is required');
        }
        if(!this.props?.name) {
            throw new BadRequest('Name is required');
        }
        if(!this.props?.email) {
            throw new BadRequest('E-mail is required');
        }
        if(!this.props?.password) {
            throw new BadRequest('Password is required');
        }
    }
}

// domain/repositories/UserRepository.ts
abstract class UserRepositoryContract {
    abstract getByEmail(email: string): Promise<IUser | null>;
    abstract create(user: IUserCreate): Promise<IUserCreate>;
}

// application/usecases/SignInUseCase.ts
class SignInUseCase implements IUseCase<IUserCreate, true> {
    constructor(
        private readonly userRepository: UserRepositoryContract,
    ) {}

    async execute({ id, name, email, password }: IUserCreate): Promise<true> {
        const userAlreadyExists = await this.userRepository.getByEmail(email);
        if(!userAlreadyExists) {
            throw new ConflictException('User already exists');
        }

        await this.userRepository.create({ id, name, email, password });

        return true;
    }
}

// interfaces/controller/SignInController.ts
class SignInController implements IController {
    constructor(
        private signInUseCase: SignInUseCase,
    ) {}
    
    handle(request: IRequest): IResponse {
        try {
            const user = new User({ 
                id: 'id', 
                email: request.body?.email, 
                name: request.body?.name, 
                password: request.body?.password 
            });

            this.signInUseCase.execute(user.props);

            return {
                statusCode: 201,
                body: null,
            }
        } catch(error) {
            if(error instanceof IError) {
                console.log({statusCode: error.statusCode,
                    body: { message: error.message }})
                return {
                    statusCode: error.statusCode,
                    body: { message: error.message }
                }
            }
            return {
                statusCode: error.statusCode,
                body: null,
            }
        }
    }
}

//new SignInController().handle({ body: { name: '1212' } })