defmodule Api.Application do
  use Application

  Dotenv.load(".env")

  @spec get_child_opts :: [{:ip, {:local, <<_::128>>}} | {:port, integer}, ...]
  def get_child_opts() do
    if elem(:os.type(), 1) === :linux &&
         elem(
           System.cmd("grep", ["docker-init", "/proc/1/sched"]),
           0
         ) !== "" do
      File.rm("/socket/api.sock")
      [port: 0, ip: {:local, "/socket/api.sock"}]
    else
      [port: String.to_integer(System.get_env("API_PORT", "8899"))]
    end
  end

  @impl true
  @spec start(any, any) :: {:error, any} | {:ok, pid}
  def start(_type, _args) do
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
      {
        Plug.Cowboy,
        scheme: :http, plug: APIRouter, options: get_child_opts()
      }
    ]

    opts = [strategy: :one_for_one, name: Api.Supervisor]

    Supervisor.start_link(children, opts)
  end
end