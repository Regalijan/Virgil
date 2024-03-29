defmodule Api.Application do
  use Application

  @spec get_child_opts(boolean) :: [{:ip, {:local, <<_::128>>}} | {:port, integer}, ...]
  def get_child_opts(is_docker) do
    if is_docker do
      File.rm("/socket/api.sock")
      [port: 0, ip: {:local, "/socket/api.sock"}]
    else
      [port: String.to_integer(System.get_env("API_PORT", "8899"))]
    end
  end

  @impl true
  @spec start(any, any) :: {:error, any} | {:ok, pid}
  def start(_type, _args) do
    is_docker =
      elem(:os.type(), 1) === :linux &&
        elem(System.cmd("grep", ["docker-init", "/proc/1/sched"]), 0) !== ""

    if !is_docker do
      Dotenv.load(Path.join(File.cwd!(), "../.env"))
    end

    if System.get_env("DISABLE_SERVER") !== nil do
      System.stop(0)
    end

    children = [
      %{
        id: Mongo,
        start:
          {Mongo, :start_link,
           [[name: :mongo, url: System.get_env("MONGOURL", "mongodb://mongo:27017/bot")]]}
      },
      %{
        id: AMQP.Connection,
        start: {AMQP.Connection, :open, [[System.get_env("AMQP_URL", "amqp://rabbit:5672")]]}
      },
      {
        Plug.Cowboy,
        scheme: :http, plug: APIRouter, options: get_child_opts(is_docker)
      },
      {
        Finch,
        name: HTTP
      },
      {
        Redix,
        start:
          {Redix, :start_link, [[System.get_env("REDIS", "redis://redis:6379"), name: :redis]]}
      }
    ]

    opts = [strategy: :one_for_one, name: Api.Supervisor]

    Supervisor.start_link(children, opts)
  end
end
